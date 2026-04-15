import test from 'node:test';
import assert from 'node:assert/strict';
import { computePriorityScore, findDuplicateTicket } from './dedupe.js';

test('findDuplicateTicket selects best candidate above threshold', () => {
  const result = findDuplicateTicket({
    sourceTitle: 'Checkout spinner never ends after payment',
    sourceSummary: 'Card payment succeeds but user stays loading forever',
    sourceReproSteps: ['Open checkout', 'Submit card', 'Observe infinite spinner'],
    candidateTickets: [
      {
        id: 'ticket_a',
        title: 'Settings icon misaligned',
        summary: 'Icon shifts by two pixels on small screens',
      },
      {
        id: 'ticket_b',
        title: 'Payment checkout spinner never ends',
        summary: 'After card payment, checkout remains in loading state',
      },
    ],
    threshold: 0.4,
  });

  assert.equal(result.duplicateOfTicketId, 'ticket_b');
  assert.ok(result.confidenceScore >= 0.4);
});

test('computePriorityScore increases with report count and recency', async () => {
  const lower = await computePriorityScore({
    severity: 2,
    reportCount: 1,
    createdAtIso: '2026-04-01T00:00:00.000Z',
    nowIso: '2026-04-15T00:00:00.000Z',
  });

  const higher = await computePriorityScore({
    severity: 2,
    reportCount: 5,
    createdAtIso: '2026-04-14T20:00:00.000Z',
    nowIso: '2026-04-15T00:00:00.000Z',
  });

  assert.ok(higher > lower);
});
