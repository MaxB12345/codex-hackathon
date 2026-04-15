import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapWorker, createBootstrapSummary } from './bootstrap.js';

test('createBootstrapSummary exposes phase two modules and providers', () => {
  const summary = createBootstrapSummary();

  assert.equal(summary.phase, 2);
  assert.deepEqual(summary.apps, ['web', 'api', 'worker']);
  assert.ok(summary.skills.includes('create_ticket'));
  assert.ok(summary.providers.includes('model_provider'));
});

test('bootstrapWorker advertises core queues', () => {
  const worker = bootstrapWorker();

  assert.equal(worker.name, 'phase-two-worker');
  assert.ok(worker.queues.includes('diagnose-ticket'));
  assert.ok(worker.queues.includes('run-fix-loop'));
});
