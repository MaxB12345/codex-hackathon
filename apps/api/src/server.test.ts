import test from 'node:test';
import assert from 'node:assert/strict';
import { createBootstrapSummary } from '@bug-agent/orchestrator';

test('bootstrap summary exposes key phase 4 modules', () => {
  const summary = createBootstrapSummary();

  assert.equal(summary.phase, 4);
  assert.ok(summary.skills.includes('create_ticket'));
  assert.ok(summary.providers.includes('git_provider'));
});
