import test from 'node:test';
import assert from 'node:assert/strict';
import { getMigrationFiles, renderPhaseTwoSql } from './index.js';

test('phase 2 schema renders key tables', () => {
  const sql = renderPhaseTwoSql();

  assert.match(sql, /create table if not exists tickets/i);
  assert.match(sql, /create table if not exists audit_logs/i);
  assert.match(sql, /create table if not exists ticket_events/i);
});

test('migration manifest exposes the phase 2 file', () => {
  const migrations = getMigrationFiles();

  assert.equal(migrations[0]?.version, '0001');
  assert.match(migrations[0]?.path ?? '', /0001_phase2_core\.sql$/);
});
