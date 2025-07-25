const { Client } = require('pg');
const { hashPassword } = require('../utils/password.js');

let db;

const connectDB = async () => {
  try {
    db = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'DigiEstatePERN',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    await db.connect();
    console.log('Connected to PostgreSQL database');

    // Create tables if they don't exist
    // await createTables();
    await createAdminUser();

  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Users table with UUID and all required columns
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        avatar TEXT DEFAULT '',
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        reputation DECIMAL(3,2) DEFAULT 4.5,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Users table created/verified');

    // Add missing columns to users table if they don't exist
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT ''`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT ''`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation DECIMAL(3,2) DEFAULT 4.5`);
      console.log('Added missing columns to users table');
    } catch (alterError) {
      console.log('Columns already exist or error adding columns:', alterError.message);
    }

    // Properties table with all required columns
    await db.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        location VARCHAR(255) NOT NULL,
        availability VARCHAR(50) DEFAULT 'Available',
        images TEXT[] DEFAULT '{}',
        videos TEXT[] DEFAULT '{}',
        bedrooms INTEGER DEFAULT NULL,
        bathrooms INTEGER DEFAULT NULL,
        floor_number INTEGER DEFAULT NULL,
        total_floors INTEGER DEFAULT NULL,
        area DECIMAL(10,2) DEFAULT NULL,
        road_width DECIMAL(8,2) DEFAULT NULL,
        is_corner_plot BOOLEAN DEFAULT false,
        parking_spaces INTEGER DEFAULT NULL,
        is_furnished BOOLEAN DEFAULT false,
        has_ac BOOLEAN DEFAULT false,
        has_lift BOOLEAN DEFAULT false,
        has_parking BOOLEAN DEFAULT false,
        custom_features JSONB DEFAULT '[]',
        nearby_facilities JSONB DEFAULT '[]',
        owner_id UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'Pending Verification',
        views INTEGER DEFAULT 0,
        inquiries INTEGER DEFAULT 0,
        bookings INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Properties table created/verified');

    // Add missing columns to properties table if they don't exist
    try {
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT NULL`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT NULL`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_number INTEGER DEFAULT NULL`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors INTEGER DEFAULT NULL`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) DEFAULT NULL`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS road_width DECIMAL(8,2) DEFAULT NULL`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_corner_plot BOOLEAN DEFAULT false`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT NULL`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN DEFAULT false`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_ac BOOLEAN DEFAULT false`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_lift BOOLEAN DEFAULT false`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_features JSONB DEFAULT '[]'`);
      await db.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_facilities JSONB DEFAULT '[]'`);
      console.log('Added missing columns to properties table');
    } catch (alterError) {
      console.log('Properties columns already exist or error adding columns:', alterError.message);
    }

    // Bookings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        property_id VARCHAR(255) REFERENCES properties(id),
        status VARCHAR(50) DEFAULT 'pending',
        booking_date TIMESTAMP,
        message TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Bookings table created/verified');

    // Messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        sender_id UUID REFERENCES users(id),
        receiver_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        attachments TEXT[] DEFAULT '{}',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Messages table created/verified');

    // Reviews table
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(255) PRIMARY KEY,
        reviewer_id UUID REFERENCES users(id),
        target_id VARCHAR(255) NOT NULL,
        target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('property', 'user')),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Reviews table created/verified');

    // Notifications table
    console.log('Creating notifications table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('booking', 'payment', 'message', 'admin', 'system')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Notifications table created/verified');

    // Notification preferences table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        booking_notifications BOOLEAN DEFAULT true,
        payment_notifications BOOLEAN DEFAULT true,
        message_notifications BOOLEAN DEFAULT true,
        admin_notifications BOOLEAN DEFAULT true,
        system_notifications BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Notification preferences table created/verified');

    // Complaints table
    await db.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id VARCHAR(255) PRIMARY KEY,
        complainant VARCHAR(255) NOT NULL,
        target VARCHAR(255) NOT NULL,
        target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('user', 'property')),
        type VARCHAR(100) NOT NULL CHECK (type IN ('Fraudulent Listing', 'Inappropriate Behavior', 'Payment Issues', 'Other')),
        description TEXT NOT NULL,
        evidence TEXT[] DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'dismissed')),
        resolution TEXT DEFAULT '',
        admin_notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Complaints table created/verified');

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
    `);

    console.log('Database tables and indexes created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@digihomehub.com';
    const adminPassword = 'admin123';

    // Check if admin user already exists
    const existingAdmin = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await hashPassword(adminPassword);
      const result = await db.query(
        `INSERT INTO users (email, password, name, role, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [adminEmail, hashedPassword, 'Admin User', 'admin', true]
      );

      const adminUserId = result.rows[0].id;

      // Create default notification preferences for admin
      await db.query(
        `INSERT INTO notification_preferences (user_id, booking_notifications, payment_notifications, message_notifications, admin_notifications, system_notifications, email_notifications)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [adminUserId, true, true, true, true, true, true]
      );

      console.log('Admin user created successfully');
      console.log(`Admin credentials: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

module.exports = { connectDB, getDB };