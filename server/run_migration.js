const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: "postgresql://postgres.upybiytxdslvtvxonwdx:hello@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase_migration_property_context.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration...');
    
    // Split the SQL into individual statements (removing comments and empty lines)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.match(/^SELECT.*FROM.*messages/)); // Skip the verification queries for now

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
          await client.query(statement);
          console.log(`✅ Statement ${i + 1} completed`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log('Statement was:', statement.substring(0, 100) + '...');
          }
        }
      }
    }

    console.log('🔍 Running verification queries...');
    
    // Check if columns exist
    const columnsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND table_schema = 'public'
      AND column_name IN ('property_title', 'property_location', 'property_price', 'property_image_url')
      ORDER BY column_name
    `);
    
    console.log('📊 New columns added:');
    console.table(columnsCheck.rows);

    // Check message counts
    const messageStats = await client.query(`
      SELECT 
          COUNT(*) as total_messages,
          COUNT(property_id) as messages_with_property_id,
          COUNT(property_title) as messages_with_property_title,
          COUNT(property_location) as messages_with_property_location,
          COUNT(property_price) as messages_with_property_price
      FROM public.messages
    `);
    
    console.log('📈 Message statistics:');
    console.table(messageStats.rows);

    // Check sample messages with property context
    const sampleMessages = await client.query(`
      SELECT 
          id, 
          LEFT(content, 30) as content_preview,
          property_id, 
          property_title, 
          property_location, 
          property_price
      FROM public.messages 
      WHERE property_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (sampleMessages.rows.length > 0) {
      console.log('📝 Sample messages with property context:');
      console.table(sampleMessages.rows);
    } else {
      console.log('ℹ️  No existing messages with property context found');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runMigration().catch(console.error);
