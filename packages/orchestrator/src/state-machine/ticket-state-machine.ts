import type { AuditLogService } from '@bug-agent/audit';
import type { TicketRecord, TicketState, TicketStateTransition } from '@bug-agent/shared';
import type { TicketRepository } from '@bug-agent/db';

export interface TransitionTicketInput {
  ticketId: string;
  to: TicketState;
  actorType: 'system' | 'user' | 'worker' | 'api';
  reasonCode: string;
  summary: string;
}

export class InvalidTicketTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTicketTransitionError';
  }
}

const allowedTransitions: Record<TicketState, TicketState[]> = {
  NEW_REPORT: ['STRUCTURED'],
  STRUCTURED: ['DEDUPED'],
  DEDUPED: ['PENDING_VERIFICATION'],
  PENDING_VERIFICATION: ['VERIFIED', 'UNVERIFIED_CLOSED', 'FIX_BLOCKED_ENVIRONMENT'],
  VERIFIED: ['DIAGNOSED'],
  DIAGNOSED: ['FIX_PLANNING'],
  FIX_PLANNING: ['FIX_IMPLEMENTING', 'FIX_FAILED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED'],
  FIX_IMPLEMENTING: ['FIX_TESTING', 'FIX_FAILED_COMPLEXITY', 'FIX_BLOCKED_ENVIRONMENT'],
  FIX_TESTING: [
    'PR_READY',
    'FIX_FAILED_STAGNATION',
    'FIX_FAILED_LOW_CONFIDENCE',
    'FIX_BLOCKED_ENVIRONMENT',
    'MANUAL_REVIEW_REQUIRED',
  ],
  FIX_FAILED_STAGNATION: [],
  FIX_FAILED_LOW_CONFIDENCE: [],
  FIX_BLOCKED_ENVIRONMENT: [],
  FIX_FAILED_COMPLEXITY: [],
  UNVERIFIED_CLOSED: [],
  PR_READY: ['PR_OPENED'],
  PR_OPENED: ['MERGED', 'REJECTED'],
  MERGED: [],
  REJECTED: [],
  MANUAL_REVIEW_REQUIRED: [],
};

export class TicketStateMachine {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  canTransition(from: TicketState, to: TicketState): boolean {
    return allowedTransitions[from].includes(to);
  }

  async transition(input: TransitionTicketInput): Promise<TicketRecord> {
    const ticket = await this.ticketRepository.getById(input.ticketId);
    if (!ticket) {
      throw new InvalidTicketTransitionError(`Ticket ${input.ticketId} was not found`);
    }

    if (!this.canTransition(ticket.status, input.to)) {
      throw new InvalidTicketTransitionError(
        `Cannot transition ticket ${ticket.id} from ${ticket.status} to ${input.to}`,
      );
    }

    if (input.to === 'PR_OPENED' && ticket.status !== 'PR_READY') {
      throw new InvalidTicketTransitionError('PRs can only be opened from PR_READY');
    }

    const updatedTicket: TicketRecord = {
      ...ticket,
      status: input.to,
      updatedAt: new Date().toISOString(),
    };

    const transition: TicketStateTransition = {
      ticketId: ticket.id,
      from: ticket.status,
      to: input.to,
      actorType: input.actorType,
      reasonCode: input.reasonCode,
      summary: input.summary,
      createdAt: updatedTicket.updatedAt,
    };

    await this.ticketRepository.update(updatedTicket);
    await this.ticketRepository.appendTransition(transition);
    await this.auditLogService.record({
      workspaceId: ticket.workspaceId,
      entityType: 'ticket',
      entityId: ticket.id,
      action: 'ticket.transitioned',
      actorType: input.actorType,
      metadataJson: {
        from: transition.from,
        to: transition.to,
        reasonCode: transition.reasonCode,
        summary: transition.summary,
      },
    });

    return updatedTicket;
  }
}
