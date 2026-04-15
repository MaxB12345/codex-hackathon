import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditLogService, InMemoryAuditLogRepository } from '@bug-agent/audit';
import { InMemoryTicketRepository } from '@bug-agent/db';
import type { TicketRecord } from '@bug-agent/shared';
import { InvalidTicketTransitionError, TicketStateMachine } from './ticket-state-machine.js';

function buildTicket(overrides: Partial<TicketRecord> = {}): TicketRecord {
  return {
    id: 'ticket_1',
    workspaceId: 'ws_1',
    title: 'Checkout spinner never ends',
    summary: 'Payment success leaves user stuck on loading state',
    status: 'NEW_REPORT',
    severity: 3,
    priorityScore: 2.5,
    reportCount: 1,
    createdAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
    ...overrides,
  };
}

test('state machine transitions ticket and persists audit trail', async () => {
  const ticketRepository = new InMemoryTicketRepository();
  const auditRepository = new InMemoryAuditLogRepository();
  const auditService = new AuditLogService(auditRepository);
  const stateMachine = new TicketStateMachine(ticketRepository, auditService);

  await ticketRepository.create(buildTicket());

  const updated = await stateMachine.transition({
    ticketId: 'ticket_1',
    to: 'STRUCTURED',
    actorType: 'worker',
    reasonCode: 'intake.completed',
    summary: 'The intake stage finished successfully.',
  });

  assert.equal(updated.status, 'STRUCTURED');

  const transitions = await ticketRepository.listTransitions('ticket_1');
  assert.equal(transitions.length, 1);
  assert.equal(transitions[0]?.from, 'NEW_REPORT');
  assert.equal(transitions[0]?.to, 'STRUCTURED');

  const auditEvents = await auditRepository.listByEntity('ticket', 'ticket_1');
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0]?.action, 'ticket.transitioned');
});

test('state machine rejects invalid transitions', async () => {
  const ticketRepository = new InMemoryTicketRepository();
  const auditRepository = new InMemoryAuditLogRepository();
  const auditService = new AuditLogService(auditRepository);
  const stateMachine = new TicketStateMachine(ticketRepository, auditService);

  await ticketRepository.create(buildTicket());

  await assert.rejects(
    stateMachine.transition({
      ticketId: 'ticket_1',
      to: 'PR_OPENED',
      actorType: 'worker',
      reasonCode: 'pr.created',
      summary: 'Attempted to open a PR before verification.',
    }),
    InvalidTicketTransitionError,
  );
});

test('state machine allows PR opening only from PR_READY', async () => {
  const ticketRepository = new InMemoryTicketRepository();
  const auditRepository = new InMemoryAuditLogRepository();
  const auditService = new AuditLogService(auditRepository);
  const stateMachine = new TicketStateMachine(ticketRepository, auditService);

  await ticketRepository.create(buildTicket({ status: 'PR_READY' }));

  const updated = await stateMachine.transition({
    ticketId: 'ticket_1',
    to: 'PR_OPENED',
    actorType: 'worker',
    reasonCode: 'pr.created',
    summary: 'All required checks passed and a PR was opened.',
  });

  assert.equal(updated.status, 'PR_OPENED');
});
