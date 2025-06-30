const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function runMigration() {
  const db = neon(process.env.DATABASE_URL);
  
  try {
    const sql = fs.readFileSync('./migrations/001_create_sessions_table.sql', 'utf-8');
    console.log('Running migration...');
    await db(sql);
    console.log('✅ Sessions table created successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Sessions table already exists');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
  }
}

runMigration();