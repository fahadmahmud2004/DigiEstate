const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const testDeletionNotification = async () => {
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

    // Check recent notifications for property deletions
    const notificationQuery = `
      SELECT n.*, u.name as user_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.message LIKE '%deleted%'
      ORDER BY n.created_at DESC
      LIMIT 10;
    `;
    
    const result = await client.query(notificationQuery);
    
    console.log('\n📋 Recent property deletion notifications:');
    if (result.rows.length > 0) {
      result.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. User: ${row.user_name}`);
        console.log(`   Type: ${row.type}`);
        console.log(`   Title: ${row.title}`);
        console.log(`   Message: ${row.message}`);
        console.log(`   Data: ${JSON.stringify(row.data, null, 2)}`);
        console.log(`   Created: ${row.created_at}`);
      });
    } else {
      console.log('   No deletion notifications found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
testDeletionNotification();
