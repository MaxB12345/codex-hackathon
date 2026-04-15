import { readFile } from 'node:fs/promises';
import { getMigrationFiles, getSqliteDatabase } from '../index.js';

const db = getSqliteDatabase();
const migrations = getMigrationFiles();
console.log(`[db] sqlite migration run starting with ${migrations.length} file(s)`);

for (const migration of migrations) {
  const contents = await readFile(migration.path, 'utf8');
  db.exec(contents);

  const statementCount = contents
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean).length;

  console.log(`[db] applied ${migration.version}_${migration.name}: ${statementCount} statements`);
}
