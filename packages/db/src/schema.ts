export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  default?: string;
  references?: string;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: string[];
}

export const phaseTwoSchema: TableDefinition[] = [
  {
    name: 'workspaces',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'name', type: 'text' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
  },
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'workspace_id', type: 'text', references: 'workspaces(id)' },
      { name: 'email', type: 'text', unique: true },
      { name: 'role', type: 'text' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: ['create index if not exists users_workspace_idx on users (workspace_id);'],
  },
  {
    name: 'repos',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'workspace_id', type: 'text', references: 'workspaces(id)' },
      { name: 'provider', type: 'text' },
      { name: 'owner', type: 'text' },
      { name: 'name', type: 'text' },
      { name: 'default_branch', type: 'text' },
      { name: 'installation_id', type: 'text', nullable: true },
      { name: 'setup_config_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: [
      'create unique index if not exists repos_workspace_unique_idx on repos (workspace_id);',
      'create index if not exists repos_owner_name_idx on repos (owner, name);',
    ],
  },
  {
    name: 'bug_reports',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'workspace_id', type: 'text', references: 'workspaces(id)' },
      { name: 'raw_text', type: 'text' },
      { name: 'structured_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'reporter_identifier', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: ['create index if not exists bug_reports_workspace_idx on bug_reports (workspace_id);'],
  },
  {
    name: 'attachments',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'bug_report_id', type: 'text', references: 'bug_reports(id)' },
      { name: 'file_type', type: 'text' },
      { name: 'storage_url', type: 'text' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: ['create index if not exists attachments_bug_report_idx on attachments (bug_report_id);'],
  },
  {
    name: 'tickets',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'workspace_id', type: 'text', references: 'workspaces(id)' },
      { name: 'title', type: 'text' },
      { name: 'summary', type: 'text' },
      { name: 'expected_behavior', type: 'text', nullable: true },
      { name: 'actual_behavior', type: 'text', nullable: true },
      { name: 'repro_steps_json', type: 'jsonb', default: "'[]'::jsonb" },
      { name: 'environment_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'status', type: 'text' },
      { name: 'severity', type: 'smallint' },
      { name: 'priority_score', type: 'double precision', default: '0' },
      { name: 'report_count', type: 'integer', default: '1' },
      { name: 'canonical_fingerprint', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: [
      'create index if not exists tickets_workspace_status_idx on tickets (workspace_id, status);',
      'create index if not exists tickets_priority_idx on tickets (priority_score desc);',
    ],
  },
  {
    name: 'ticket_reports',
    columns: [
      { name: 'ticket_id', type: 'text', references: 'tickets(id)' },
      { name: 'bug_report_id', type: 'text', references: 'bug_reports(id)' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: ['create unique index if not exists ticket_reports_unique_idx on ticket_reports (ticket_id, bug_report_id);'],
  },
  {
    name: 'reproduction_runs',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)' },
      { name: 'status', type: 'text' },
      { name: 'logs_url', type: 'text', nullable: true },
      { name: 'artifact_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
  },
  {
    name: 'diagnosis_runs',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)' },
      { name: 'summary', type: 'text' },
      { name: 'confidence_score', type: 'double precision' },
      { name: 'suspected_files_json', type: 'jsonb', default: "'[]'::jsonb" },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
  },
  {
    name: 'fix_iterations',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)' },
      { name: 'iteration_number', type: 'integer' },
      { name: 'plan_summary', type: 'text' },
      { name: 'plan_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'changed_files_json', type: 'jsonb', default: "'[]'::jsonb" },
      { name: 'diff_url', type: 'text', nullable: true },
      { name: 'test_result', type: 'text', nullable: true },
      { name: 'failure_summary', type: 'text', nullable: true },
      { name: 'confidence_score', type: 'double precision' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: ['create index if not exists fix_iterations_ticket_iteration_idx on fix_iterations (ticket_id, iteration_number);'],
  },
  {
    name: 'test_runs',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)' },
      { name: 'fix_iteration_id', type: 'text', references: 'fix_iterations(id)', nullable: true },
      { name: 'result', type: 'text' },
      { name: 'output_url', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
  },
  {
    name: 'pull_requests',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)' },
      { name: 'repo_id', type: 'text', references: 'repos(id)' },
      { name: 'branch_name', type: 'text' },
      { name: 'pr_number', type: 'integer', nullable: true },
      { name: 'pr_url', type: 'text', nullable: true },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
  },
  {
    name: 'audit_logs',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'workspace_id', type: 'text', references: 'workspaces(id)' },
      { name: 'entity_type', type: 'text' },
      { name: 'entity_id', type: 'text' },
      { name: 'action', type: 'text' },
      { name: 'actor_type', type: 'text' },
      { name: 'metadata_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: [
      'create index if not exists audit_logs_workspace_idx on audit_logs (workspace_id);',
      'create index if not exists audit_logs_entity_idx on audit_logs (entity_type, entity_id);',
    ],
  },
  {
    name: 'ticket_events',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)' },
      { name: 'from_status', type: 'text' },
      { name: 'to_status', type: 'text' },
      { name: 'reason_code', type: 'text' },
      { name: 'summary', type: 'text' },
      { name: 'actor_type', type: 'text' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
    indexes: ['create index if not exists ticket_events_ticket_idx on ticket_events (ticket_id, created_at desc);'],
  },
  {
    name: 'skill_runs',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)', nullable: true },
      { name: 'skill_key', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'input_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'output_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
  },
  {
    name: 'agent_runs',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)', nullable: true },
      { name: 'agent_name', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'prompt_version', type: 'text' },
      { name: 'input_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'output_json', type: 'jsonb', default: "'{}'::jsonb" },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
  },
  {
    name: 'execution_sessions',
    columns: [
      { name: 'id', type: 'text', primaryKey: true },
      { name: 'ticket_id', type: 'text', references: 'tickets(id)', nullable: true },
      { name: 'status', type: 'text' },
      { name: 'command_history_json', type: 'jsonb', default: "'[]'::jsonb" },
      { name: 'working_directory', type: 'text' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
    ],
  },
];

export function renderCreateTableSql(table: TableDefinition): string {
  const columns = table.columns
    .map((column) => {
      const parts = [column.name, column.type];
      if (column.primaryKey) parts.push('primary key');
      if (!column.nullable && !column.primaryKey) parts.push('not null');
      if (column.unique) parts.push('unique');
      if (column.default) parts.push(`default ${column.default}`);
      if (column.references) parts.push(`references ${column.references}`);
      return `  ${parts.join(' ')}`;
    })
    .join(',\n');

  return `create table if not exists ${table.name} (\n${columns}\n);`;
}

export function renderPhaseTwoSql(): string {
  const statements = phaseTwoSchema.flatMap((table) => [
    renderCreateTableSql(table),
    ...(table.indexes ?? []),
  ]);

  return statements.join('\n\n');
}
