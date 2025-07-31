const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const updateAhsanVillaStatus = async () => {
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

    // Update Ahsan Villa status
    const updateQuery = `
      UPDATE properties 
      SET status = 'active', 
          updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(title) LIKE '%ahsan villa%' 
        AND status = 'pending'
      RETURNING id, title, status, updated_at;
    `;

    const result = await client.query(updateQuery);
    
    if (result.rows.length > 0) {
      console.log('✅ Successfully updated Ahsan Villa:');
      result.rows.forEach(row => {
        console.log(`- ID: ${row.id}`);
        console.log(`- Title: ${row.title}`);
        console.log(`- Status: ${row.status}`);
        console.log(`- Updated: ${row.updated_at}`);
      });
    } else {
      console.log('❌ No properties found matching "Ahsan Villa" with pending status');
      
      // Check if property exists with different status
      const checkQuery = `
        SELECT id, title, status 
        FROM properties 
        WHERE LOWER(title) LIKE '%ahsan villa%';
      `;
      const checkResult = await client.query(checkQuery);
      
      if (checkResult.rows.length > 0) {
        console.log('📋 Found Ahsan Villa properties with different status:');
        checkResult.rows.forEach(row => {
          console.log(`- ID: ${row.id}, Title: ${row.title}, Status: ${row.status}`);
        });
      } else {
        console.log('❌ No properties found with "Ahsan Villa" in the title');
      }
    }

  } catch (error) {
    console.error('❌ Error updating property status:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
};

// Run the update
updateAhsanVillaStatus();
