create table if not exists workspaces (
  id text primary key,
  name text not null,
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists users (
  id text primary key,
  workspace_id text not null references workspaces(id),
  email text not null unique,
  role text not null,
  created_at text not null default CURRENT_TIMESTAMP
);
create index if not exists users_workspace_idx on users (workspace_id);

create table if not exists repos (
  id text primary key,
  workspace_id text not null references workspaces(id),
  provider text not null,
  owner text not null,
  name text not null,
  default_branch text not null,
  installation_id text,
  setup_config_json text not null default '{}',
  created_at text not null default CURRENT_TIMESTAMP
);
create unique index if not exists repos_workspace_unique_idx on repos (workspace_id);
create index if not exists repos_owner_name_idx on repos (owner, name);

create table if not exists bug_reports (
  id text primary key,
  workspace_id text not null references workspaces(id),
  raw_text text not null,
  structured_json text not null default '{}',
  reporter_identifier text,
  created_at text not null default CURRENT_TIMESTAMP
);
create index if not exists bug_reports_workspace_idx on bug_reports (workspace_id);

create table if not exists attachments (
  id text primary key,
  bug_report_id text not null references bug_reports(id),
  file_type text not null,
  storage_url text not null,
  created_at text not null default CURRENT_TIMESTAMP
);
create index if not exists attachments_bug_report_idx on attachments (bug_report_id);

create table if not exists tickets (
  id text primary key,
  workspace_id text not null references workspaces(id),
  title text not null,
  summary text not null,
  expected_behavior text,
  actual_behavior text,
  repro_steps_json text not null default '[]',
  environment_json text not null default '{}',
  status text not null,
  severity integer not null,
  priority_score real not null default 0,
  report_count integer not null default 1,
  canonical_fingerprint text,
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);
create index if not exists tickets_workspace_status_idx on tickets (workspace_id, status);
create index if not exists tickets_priority_idx on tickets (priority_score desc);

create table if not exists ticket_reports (
  ticket_id text not null references tickets(id),
  bug_report_id text not null references bug_reports(id),
  created_at text not null default CURRENT_TIMESTAMP
);
create unique index if not exists ticket_reports_unique_idx on ticket_reports (ticket_id, bug_report_id);

create table if not exists reproduction_runs (
  id text primary key,
  ticket_id text not null references tickets(id),
  status text not null,
  logs_url text,
  artifact_json text not null default '{}',
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists diagnosis_runs (
  id text primary key,
  ticket_id text not null references tickets(id),
  summary text not null,
  confidence_score real not null,
  suspected_files_json text not null default '[]',
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists fix_iterations (
  id text primary key,
  ticket_id text not null references tickets(id),
  iteration_number integer not null,
  plan_summary text not null,
  plan_json text not null default '{}',
  changed_files_json text not null default '[]',
  diff_url text,
  test_result text,
  failure_summary text,
  confidence_score real not null,
  created_at text not null default CURRENT_TIMESTAMP
);
create index if not exists fix_iterations_ticket_iteration_idx on fix_iterations (ticket_id, iteration_number);

create table if not exists test_runs (
  id text primary key,
  ticket_id text not null references tickets(id),
  fix_iteration_id text references fix_iterations(id),
  result text not null,
  output_url text,
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists pull_requests (
  id text primary key,
  ticket_id text not null references tickets(id),
  repo_id text not null references repos(id),
  branch_name text not null,
  pr_number integer,
  pr_url text,
  status text not null,
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists audit_logs (
  id text primary key,
  workspace_id text not null references workspaces(id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_type text not null,
  metadata_json text not null default '{}',
  created_at text not null default CURRENT_TIMESTAMP
);
create index if not exists audit_logs_workspace_idx on audit_logs (workspace_id);
create index if not exists audit_logs_entity_idx on audit_logs (entity_type, entity_id);

create table if not exists ticket_events (
  id text primary key,
  ticket_id text not null references tickets(id),
  from_status text not null,
  to_status text not null,
  reason_code text not null,
  summary text not null,
  actor_type text not null,
  created_at text not null default CURRENT_TIMESTAMP
);
create index if not exists ticket_events_ticket_idx on ticket_events (ticket_id, created_at desc);

create table if not exists skill_runs (
  id text primary key,
  ticket_id text references tickets(id),
  skill_key text not null,
  status text not null,
  input_json text not null default '{}',
  output_json text not null default '{}',
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists agent_runs (
  id text primary key,
  ticket_id text references tickets(id),
  agent_name text not null,
  status text not null,
  prompt_version text not null,
  input_json text not null default '{}',
  output_json text not null default '{}',
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists execution_sessions (
  id text primary key,
  ticket_id text references tickets(id),
  status text not null,
  command_history_json text not null default '[]',
  working_directory text not null,
  created_at text not null default CURRENT_TIMESTAMP
);
