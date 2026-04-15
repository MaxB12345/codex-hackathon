import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFixAgentResponse } from './bug-fix-response.js';

test('normalizeFixAgentResponse applies safe defaults', () => {
  const normalized = normalizeFixAgentResponse({
    report: {
      executiveSummary: 'Found issue in router guard.',
      fakeGithubFindings: ['src/ui/button.tsx line 42: stale callback'],
      samplePatch: 'diff --git a/src/ui/button.tsx b/src/ui/button.tsx',
    },
  });

  assert.equal(normalized.report.executiveSummary, 'Found issue in router guard.');
  assert.equal(normalized.report.fakeGithubFindings.length, 1);
  assert.match(normalized.report.samplePatch, /diff --git/);
  assert.equal(normalized.report.pullRequestTitle, 'chore: pending fix simulation');
});

test('normalizeFixAgentResponse returns empty report for invalid input', () => {
  const normalized = normalizeFixAgentResponse(null);
  assert.equal(normalized.report.executiveSummary, 'Fix agent has not run yet.');
});
