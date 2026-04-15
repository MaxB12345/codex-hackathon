import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrioritySkill } from './calculate-priority.js';

test('calculatePrioritySkill uses severity, report count, and recency weight', async () => {
  const result = await calculatePrioritySkill.execute(
    {
      severityWeight: 3,
      reportCount: 4,
      recencyWeight: 0.5,
    },
    { actor: 'system' },
  );

  assert.equal(result.priorityScore, 3 + Math.log(5) + 0.5);
});
