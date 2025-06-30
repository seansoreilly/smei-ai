import { db } from '../lib/db';
import fs from 'fs';
import path from 'path';

async function main() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).sort();

  for (const file of migrationFiles) {
    if (file.endsWith('.sql')) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await db.query(sql);
    }
  }

  console.log('Migrations complete.');
}

main().catch((err) => {
  console.error('Error running migrations:', err);
  process.exit(1);
});
