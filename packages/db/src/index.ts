export interface MigrationPlan {
  phase: number;
  pendingTables: string[];
}

export function getPhaseOneMigrationPlan(): MigrationPlan {
  return {
    phase: 1,
    pendingTables: [
      'workspaces',
      'users',
      'repos',
      'bug_reports',
      'attachments',
      'tickets',
      'ticket_reports',
      'reproduction_runs',
      'diagnosis_runs',
      'fix_iterations',
      'test_runs',
      'pull_requests',
      'audit_logs',
    ],
  };
}
