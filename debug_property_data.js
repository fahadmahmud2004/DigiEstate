const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const checkPropertyData = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_AWS,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const result = await client.query(
      'SELECT id, title, nearby_facilities FROM properties WHERE id = $1', 
      ['49bf5ae8-089c-4c46-8f27-60fa9a7f9e12']
    );

    if (result.rows.length > 0) {
      const property = result.rows[0];
      console.log('Property ID:', property.id);
      console.log('Property Title:', property.title);
      console.log('nearbyFacilities raw:', property.nearby_facilities);
      console.log('nearbyFacilities type:', typeof property.nearby_facilities);
      console.log('nearbyFacilities isArray:', Array.isArray(property.nearby_facilities));
      
      if (property.nearby_facilities) {
        console.log('nearbyFacilities stringified:', JSON.stringify(property.nearby_facilities, null, 2));
      }
    } else {
      console.log('Property not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
};

checkPropertyData();
