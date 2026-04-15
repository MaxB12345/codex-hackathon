import { getSqliteDatabase } from '../index.js';

const db = getSqliteDatabase();
const result = db
  .prepare("insert or ignore into workspaces (id, name) values ('ws_local', 'Local Workspace')")
  .run();

console.log(`[db] seed completed, rows written: ${result.changes}`);
