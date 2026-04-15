import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBugChatResponse, tryParseJson } from './bug-chat-response.js';

test('normalizes partial payload with safe fallbacks', () => {
  const normalized = normalizeBugChatResponse({
    reply: 'Need browser version',
    snapshot: {
      title: 'Checkout spinner',
      completeness: 2,
      missingFields: ['browserVersion'],
    },
  });

  assert.equal(normalized.reply, 'Need browser version');
  assert.equal(normalized.snapshot.title, 'Checkout spinner');
  assert.equal(normalized.snapshot.completeness, 1);
  assert.equal(normalized.snapshot.browser, 'Unknown');
  assert.deepEqual(normalized.snapshot.missingFields, ['browserVersion']);
});

test('returns default response on invalid payload', () => {
  const normalized = normalizeBugChatResponse(null);
  assert.match(normalized.reply, /could not parse/i);
  assert.equal(normalized.snapshot.title, 'Untitled bug report');
});

test('tryParseJson returns null for invalid JSON', () => {
  assert.equal(tryParseJson('{bad json'), null);
});
