import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

let cached: Database.Database | null = null;

export interface SqliteOptions {
  filePath?: string;
}

export function getSqliteDatabase(options: SqliteOptions = {}): Database.Database {
  if (cached) {
    return cached;
  }

  const filePath = options.filePath ?? process.env.SQLITE_PATH ?? './.local/data/bug_agent.sqlite';
  mkdirSync(dirname(filePath), { recursive: true });

  const db = new Database(filePath);
  db.pragma('foreign_keys = ON');

  cached = db;
  return db;
}

export function closeSqliteDatabase(): void {
  if (!cached) {
    return;
  }
  cached.close();
  cached = null;
}
