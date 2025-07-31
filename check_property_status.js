const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const checkPropertyStatus = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_AWS,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database');

    // Check enum values for property_status
    const enumQuery = `
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'property_status'
      );
    `;

    const enumResult = await client.query(enumQuery);
    console.log('📋 Available status values:');
    enumResult.rows.forEach(row => {
      console.log(`- ${row.enumlabel}`);
    });

    // Check current Ahsan Villa properties
    const checkQuery = `
      SELECT id, title, status, created_at, updated_at
      FROM properties 
      WHERE LOWER(title) LIKE '%ahsan villa%'
      ORDER BY created_at DESC;
    `;
    
    const result = await client.query(checkQuery);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Found Ahsan Villa properties:');
      result.rows.forEach(row => {
        console.log(`- ID: ${row.id}`);
        console.log(`  Title: ${row.title}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Created: ${row.created_at}`);
        console.log(`  Updated: ${row.updated_at}`);
        console.log('---');
      });
    } else {
      console.log('\n❌ No properties found with "Ahsan Villa" in the title');
      
      // Show some sample properties
      const sampleQuery = `
        SELECT id, title, status 
        FROM properties 
        ORDER BY created_at DESC 
        LIMIT 5;
      `;
      const sampleResult = await client.query(sampleQuery);
      console.log('\n📋 Sample properties:');
      sampleResult.rows.forEach(row => {
        console.log(`- ${row.title} (Status: ${row.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the check
checkPropertyStatus();
