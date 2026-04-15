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
  | 'PR_READY'
  | 'PR_OPENED'
  | 'MERGED'
  | 'REJECTED'
  | 'MANUAL_REVIEW_REQUIRED';

export interface BootstrapSummary {
  phase: number;
  apps: string[];
  packages: string[];
  skills: string[];
  providers: string[];
}
