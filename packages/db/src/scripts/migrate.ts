import { readFile } from 'node:fs/promises';
import { getMigrationFiles } from '../index.js';

const migrations = getMigrationFiles();
console.log(`[db] phase 2 migration manifest contains ${migrations.length} file(s)`);

for (const migration of migrations) {
  const contents = await readFile(migration.path, 'utf8');
  const statementCount = contents
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean).length;

  console.log(`[db] ${migration.version}_${migration.name}: ${statementCount} statements ready`);
}
