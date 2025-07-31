const { Client } = require('pg');

async function updatePropertyStatus() {
  const client = new Client({
    connectionString: "postgresql://postgres.upybiytxdslvtvxonwdx:hello@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // First, find the property
    console.log('🔍 Searching for "lalbag kella" property...');
    const searchResult = await client.query(`
      SELECT id, title, status, owner_id, created_at 
      FROM public.properties 
      WHERE LOWER(title) LIKE '%lalbag kella%'
    `);

    if (searchResult.rows.length === 0) {
      console.log('❌ No property found with name containing "lalbag kella"');
      return;
    }

    console.log('📋 Found property:');
    console.table(searchResult.rows);

    // Update the property status
    console.log('🔄 Updating property status to Active...');
    const updateResult = await client.query(`
      UPDATE public.properties 
      SET 
          status = 'Active',
          updated_at = NOW()
      WHERE LOWER(title) LIKE '%lalbag kella%'
      AND status = 'Pending Verification'
      RETURNING id, title, status, updated_at
    `);

    if (updateResult.rows.length > 0) {
      console.log('✅ Property status updated successfully!');
      console.table(updateResult.rows);
    } else {
      console.log('⚠️ No properties were updated. The property might already be Active or have a different status.');
      
      // Show current status
      const currentStatus = await client.query(`
        SELECT id, title, status 
        FROM public.properties 
        WHERE LOWER(title) LIKE '%lalbag kella%'
      `);
      console.log('Current property status:');
      console.table(currentStatus.rows);
    }

  } catch (error) {
    console.error('❌ Error updating property status:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
updatePropertyStatus().catch(console.error);
