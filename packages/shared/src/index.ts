export type TicketState =
  | 'NEW_REPORT'
  | 'STRUCTURED'
  | 'DEDUPED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'UNVERIFIED_CLOSED'
  | 'DIAGNOSED'
  | 'FIX_PLANNING'
  | 'FIX_IMPLEMENTING'
  | 'FIX_TESTING'
  | 'FIX_FAILED_STAGNATION'
  | 'FIX_FAILED_LOW_CONFIDENCE'
  | 'FIX_BLOCKED_ENVIRONMENT'
  | 'FIX_FAILED_COMPLEXITY'
  | 'PR_READY'
  | 'PR_OPENED'
  | 'MERGED'
  | 'REJECTED'
  | 'MANUAL_REVIEW_REQUIRED';

export type TicketTerminalState =
  | 'UNVERIFIED_CLOSED'
  | 'FIX_FAILED_STAGNATION'
  | 'FIX_FAILED_LOW_CONFIDENCE'
  | 'FIX_BLOCKED_ENVIRONMENT'
  | 'FIX_FAILED_COMPLEXITY'
  | 'MERGED'
  | 'REJECTED'
  | 'MANUAL_REVIEW_REQUIRED';

export type ActorType = 'system' | 'user' | 'worker' | 'api';

export interface BootstrapSummary {
  phase: number;
  apps: string[];
  packages: string[];
  skills: string[];
  providers: string[];
}

export interface TicketRecord {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  status: TicketState;
  severity: 1 | 2 | 3 | 4;
  priorityScore: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketStateTransition {
  ticketId: string;
  from: TicketState;
  to: TicketState;
  actorType: ActorType;
  reasonCode: string;
  summary: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: ActorType;
  metadataJson: Record<string, unknown>;
  createdAt: string;
}
