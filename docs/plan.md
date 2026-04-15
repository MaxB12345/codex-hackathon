# AI Bug Resolution Agent Plan

## 1. Purpose
This document is the implementation plan and system map for the MVP of the AI Bug Resolution Agent.

It translates the PRD into:
- concrete architecture
- package and module boundaries
- API endpoints
- GitHub connection design
- skill design and insertion points
- local development workflow
- phased delivery plan
- safety and execution rules

This file is the build map.
The PRD in `docs/prd.md` remains the product source of truth.

## 2. Product Summary
The product accepts bug reports from users, converts them into structured engineering tickets, deduplicates reports, attempts reproduction against a connected GitHub repository, runs a diagnosis and fix loop, validates the result with tests, and opens a pull request only if the required checks pass.

Core lifecycle:
- bug report submitted
- structured intake created
- duplicate detection runs
- priority recalculated
- reproduction attempted
- diagnosis generated
- fix plan created
- implementation applied
- tests run
- PR opened if successful
- manual review if blocked or uncertain

## 3. MVP Product Boundaries
### Included
- single workspace model
- single GitHub repository per workspace
- public bug report page
- screenshot upload
- internal dashboard
- intake agent
- dedupe logic
- priority scoring
- reproduction runner
- diagnosis stage
- fix planning stage
- implementation stage
- testing stage
- PR creation
- audit logging
- local-first development workflow

### Excluded
- multi-repo routing
- Jira/Linear sync
- Slack/Discord integrations
- autonomous merge
- mobile-specific runners
- production telemetry ingestion
- advanced screenshot similarity
- customer-facing notifications outside the app

## 4. Architecture Principles
### 4.1 Orchestrator Owns State
Agents do not control the system directly.
The orchestrator is the only component allowed to advance ticket state.

### 4.2 Skills First
Agent behavior should be composed through explicit skills wherever practical.
This keeps side effects deterministic and auditable.

### 4.3 Backend-Only Side Effects
All writes to:
- database
- filesystem artifacts
- GitHub
- shell execution
- container runtime
must happen through backend services, not directly through model output.

### 4.4 Local First
The MVP must run locally with standard developer commands and Docker-backed dependencies.
The build should optimize for debuggability over cloud-native complexity.

### 4.5 Safe Failure Over Blind Retry
The fix loop must stop when confidence is low, progress stalls, or the environment is invalid.
The system should escalate instead of looping indefinitely.

## 5. Monorepo Map
```text
/apps
  /web                 Next.js frontend
  /api                 Node.js REST API
  /worker              background job runner
/packages
  /shared              shared types and enums
  /config              env loading and runtime config
  /db                  schema, migrations, repositories
  /skills              skill contracts and implementations
  /orchestrator        ticket state machine and workflows
  /github              Git provider abstractions and implementations
  /execution           sandbox runner abstractions
  /artifacts           log/screenshot/test artifact storage
  /models              model provider abstractions and prompts
  /audit               audit logging interfaces and services
/docs
  prd.md               product requirements
  plan.md              implementation plan and system map
/AGENTS.md             engineering rules and safety constraints
/README.md             local setup and usage
```

## 6. Runtime Components
### 6.1 Web App
Purpose:
- public bug report submission
- follow-up intake chat
- ticket status page
- internal dashboard
- ticket detail view
- iteration history view
- repo connection settings

### 6.2 API App
Purpose:
- REST endpoints
- auth boundary
- file upload handling
- orchestrator command entrypoints
- GitHub connect endpoints
- read models for dashboard views

### 6.3 Worker App
Purpose:
- run long-running background jobs
- consume queue messages
- perform reproduction, diagnosis, fix loop, and PR workflows

### 6.4 SQLite
Purpose:
- persistent local system of record
- stores ticket, report, run, PR, and audit data

### 6.5 Local Artifact Storage
Purpose:
- save screenshots
- save logs
- save diffs
- save test output
- save repro artifacts

Local directory target:
```text
.local/artifacts/
  tickets/
    {ticketId}/
      reports/
      repro-runs/
      diagnosis/
      fix-iterations/
      tests/
      prs/
```

## 7. Module Responsibilities
### 7.1 packages/shared
Holds:
- ticket states
- shared DTOs
- core enums
- event names
- run result types

### 7.2 packages/config
Holds:
- env parsing
- runtime config validation
- feature flags
- provider selection

### 7.3 packages/db
Holds:
- database schema
- migration scripts
- repository interfaces
- repository implementations
- query helpers

### 7.4 packages/skills
Holds:
- skill contracts
- deterministic skill implementations
- LLM-backed skill wrappers
- skill registry

### 7.5 packages/orchestrator
Holds:
- state machine
- workflow coordination
- safety checks
- phase-specific orchestration services

### 7.6 packages/github
Holds:
- `GitProvider` interface
- local provider for development
- GitHub App provider for production
- branch/commit/PR operations
- webhook handling helpers

### 7.7 packages/execution
Holds:
- sandbox runner interface
- local execution runner
- process lifecycle helpers
- service health checks
- Playwright hooks

### 7.8 packages/artifacts
Holds:
- artifact store interface
- local filesystem implementation
- upload/download helpers

### 7.9 packages/models
Holds:
- model provider interface
- OpenAI-backed implementation
- prompt definitions
- structured output schemas

### 7.10 packages/audit
Holds:
- audit service
- audit event builder
- event persistence adapter

## 8. Data Model
### 8.1 Core Tables
- workspaces
- users
- repos
- bug_reports
- attachments
- tickets
- ticket_reports
- reproduction_runs
- diagnosis_runs
- fix_iterations
- test_runs
- pull_requests
- audit_logs
- ticket_events
- skill_runs
- agent_runs
- execution_sessions

### 8.2 Key Relationships
- one workspace has many users
- one workspace has one repo in MVP
- one bug report can attach to one canonical ticket through `ticket_reports`
- one ticket has many reproduction runs
- one ticket has many diagnosis runs
- one ticket has many fix iterations
- one ticket has zero or one active PR records in MVP
- one ticket has many audit and state events

## 9. Ticket Lifecycle
### 9.1 States
- NEW_REPORT
- STRUCTURED
- DEDUPED
- PENDING_VERIFICATION
- VERIFIED
- UNVERIFIED_CLOSED
- DIAGNOSED
- FIX_PLANNING
- FIX_IMPLEMENTING
- FIX_TESTING
- FIX_FAILED_STAGNATION
- FIX_FAILED_LOW_CONFIDENCE
- FIX_BLOCKED_ENVIRONMENT
- FIX_FAILED_COMPLEXITY
- PR_READY
- PR_OPENED
- MERGED
- REJECTED
- MANUAL_REVIEW_REQUIRED

### 9.2 State Ownership
Only the orchestrator may transition tickets.
All transitions must write:
- previous state
- next state
- reason code
- summary
- actor type
- timestamp

### 9.3 High-Level Flow
```text
NEW_REPORT
  -> STRUCTURED
  -> DEDUPED
  -> PENDING_VERIFICATION
  -> VERIFIED | UNVERIFIED_CLOSED | FIX_BLOCKED_ENVIRONMENT
  -> DIAGNOSED
  -> FIX_PLANNING
  -> FIX_IMPLEMENTING
  -> FIX_TESTING
  -> PR_READY | FIX_FAILED_STAGNATION | FIX_FAILED_LOW_CONFIDENCE | FIX_BLOCKED_ENVIRONMENT | MANUAL_REVIEW_REQUIRED
  -> PR_OPENED
```

## 10. Skill Map
Skills should be the main implementation unit where feasible.

### 10.1 Intake Skills
- `extract_bug_facts`
- `ask_followup_question`
- `score_report_completeness`
- `normalize_environment`
- `generate_ticket_draft`

Detailed behavior:
- parse free-text bug descriptions
- identify expected and actual behavior
- infer repro steps
- ask clarifying questions only when required data is missing
- normalize browser, OS, app area, and version hints
- produce a structured ticket draft

### 10.2 Ticket Skills
- `create_ticket`
- `update_ticket`
- `attach_report_to_ticket`
- `append_ticket_evidence`
- `set_ticket_status`
- `calculate_priority`
- `create_developer_handoff`

Detailed behavior:
- create canonical tickets
- update summaries and metadata
- attach reports without deleting originals
- recalculate report counts and priority
- prepare manual-review handoff packets

### 10.3 Deduplication Skills
- `embed_ticket_text`
- `candidate_ticket_search`
- `compare_ticket_similarity`
- `decide_duplicate_match`
- `merge_report_into_ticket`

Detailed behavior:
- retrieve candidate tickets by title/summary similarity
- compare structured fields such as repro steps and environment
- return `duplicate_of_ticket_id` or null
- record rationale and confidence score

### 10.4 Repository Skills
- `clone_repo`
- `checkout_branch`
- `create_branch`
- `stage_changes`
- `commit_changes`
- `push_branch`
- `open_pull_request`
- `generate_branch_name`
- `generate_pr_body`

Detailed behavior:
- clone or prepare a workspace checkout
- create isolated working branches
- stage and commit only intended changes
- push to GitHub through provider layer
- open a PR with structured summary and test evidence

### 10.5 Execution Skills
- `detect_repo_stack`
- `install_dependencies`
- `start_backend`
- `start_frontend`
- `wait_for_service_health`
- `run_unit_tests`
- `run_integration_tests`
- `run_targeted_repro_script`
- `run_playwright_flow`
- `capture_process_logs`

Detailed behavior:
- prepare reproducible local execution environment
- install dependencies safely
- start app services needed for reproduction
- run test suites and repro flows
- collect logs and screenshots

### 10.6 Analysis Skills
- `parse_logs`
- `collect_stack_traces`
- `summarize_failures`
- `inspect_changed_files`
- `compare_iteration_results`
- `detect_stagnation`
- `estimate_fix_confidence`
- `extract_root_cause_hypothesis`

Detailed behavior:
- convert raw logs into structured clues
- summarize failed tests and stack traces
- compare consecutive iterations for progress
- identify repeated failure signatures

### 10.7 Artifact Skills
- `store_screenshot`
- `store_logs`
- `store_test_output`
- `store_diff`
- `store_iteration_record`
- `fetch_iteration_history`

Detailed behavior:
- persist artifacts by ticket and run
- return artifact URLs or local paths
- support dashboard rendering

### 10.8 Guardrail Skills
- `enforce_iteration_limit`
- `validate_required_tests_passed`
- `enforce_pr_creation_guard`
- `detect_environment_blockers`
- `detect_no_repro_condition`
- `classify_failure_exit`

Detailed behavior:
- stop infinite loops
- block PR creation on failing tests
- classify failures consistently
- route tickets to manual review when appropriate

### 10.9 Model-Backed Skills
These use the OpenAI backend and should return structured JSON.
- `intake_reasoning`
- `dedupe_reasoning`
- `diagnosis_reasoning`
- `fix_plan_reasoning`
- `implementation_reasoning`
- `pr_summary_reasoning`

## 11. Agent and Orchestration Design
### 11.1 Intake Agent
Inputs:
- raw text
- screenshots
- optional environment metadata
- prior follow-up answers

Outputs:
- structured intake JSON
- completeness score
- follow-up question if missing information blocks quality

### 11.2 Dedupe Agent
Inputs:
- structured intake
- candidate tickets
- similarity metadata

Outputs:
- match/no-match
- confidence score
- rationale

### 11.3 Reproduction Agent
Inputs:
- canonical ticket
- repo config
- repro steps
- runtime config

Outputs:
- reproduced | not_reproducible | blocked
- artifacts bundle
- logs
- screenshots

### 11.4 Diagnosis Agent
Inputs:
- ticket
- repro artifacts
- logs
- failing tests
- code context

Outputs:
- root cause hypothesis
- suspected files
- confidence
- technical summary

### 11.5 Fix Planning Agent
Inputs:
- diagnosis output
- current repo snapshot
- previous iterations

Outputs:
- plan summary
- files to modify
- test plan
- confidence

### 11.6 Implementation Agent
Inputs:
- approved plan
- repo snapshot
- previous iteration context

Outputs:
- changed files
- diff summary
- tests added or updated

### 11.7 Testing Agent
Inputs:
- patched repo
- test plan
- repro validation steps

Outputs:
- pass | fail | blocked
- failure summary
- test output location

### 11.8 PR Agent
Inputs:
- successful implementation state
- passing test evidence
- diagnosis summary
- iteration history

Outputs:
- branch name
- PR title
- PR body
- linked ticket reference

## 12. Fix Loop Design
### 12.1 Loop Sequence
1. diagnosis generated
2. plan generated
3. implementation applied
4. tests executed
5. repro validation executed
6. if pass, mark `PR_READY`
7. if fail, evaluate safety conditions
8. either iterate or stop with failure classification

### 12.2 Iteration Record
Each iteration stores:
- iteration number
- plan summary
- plan JSON
- targeted files
- diff summary
- changed files
- test result
- failure summary
- confidence score
- outcome

### 12.3 Exit Conditions
Successful exit:
- required tests passed
- targeted repro validation passed
- no environment blockers remain

Failure exit:
- hard iteration limit reached
- stagnation detected
- confidence below threshold
- environment invalid
- issue not reproducible
- issue cannot be localized safely

### 12.4 Default Thresholds
- soft iteration limit: 3
- hard iteration limit: 5
- low confidence stop threshold: 0.40

## 13. API Endpoints
All API routes are under the API app.

### 13.1 Public Bug Reporting
#### `POST /api/bug-reports`
Create a new bug report.

Request:
```json
{
  "workspaceId": "ws_123",
  "message": "Checkout button spins forever after payment",
  "expectedBehavior": "User should be redirected to success page",
  "actualBehavior": "Spinner never ends",
  "stepsTried": ["Refreshed page", "Retried payment"],
  "environment": {
    "browser": "Chrome",
    "os": "macOS"
  }
}
```

Response:
```json
{
  "bugReportId": "br_123",
  "status": "NEW_REPORT",
  "nextAction": "awaiting_followup"
}
```

#### `POST /api/bug-reports/:id/attachments`
Upload screenshot or supporting file.

Response:
```json
{
  "attachmentId": "att_123",
  "storageUrl": "/artifacts/..."
}
```

#### `POST /api/bug-reports/:id/messages`
Submit follow-up response in intake chat.

Response:
```json
{
  "bugReportId": "br_123",
  "status": "STRUCTURED",
  "structured": true
}
```

#### `GET /api/bug-reports/:id/status`
Get current intake/report status.

### 13.2 Internal Ticket APIs
#### `GET /api/tickets`
List tickets for dashboard.

Query params:
- `status`
- `severity`
- `priorityMin`
- `cursor`

#### `GET /api/tickets/:id`
Return ticket detail including summary, duplicates, reproduction results, diagnosis, fix status, and PR metadata.

#### `GET /api/tickets/:id/iterations`
Return fix iteration history.

#### `GET /api/tickets/:id/logs`
Return artifact links and execution summaries.

#### `POST /api/tickets/:id/verify`
Queue reproduction workflow.

Response:
```json
{
  "ticketId": "t_123",
  "queued": true,
  "job": "reproduce-ticket"
}
```

#### `POST /api/tickets/:id/run-fix-loop`
Queue diagnosis + plan + implement + test loop.

#### `POST /api/tickets/:id/retry`
Retry a failed stage if policy allows.

#### `POST /api/tickets/:id/manual-review`
Force manual review state with reason.

### 13.3 Workspace and Repo APIs
#### `POST /api/workspaces`
Create workspace.

#### `GET /api/workspaces/:id`
Return workspace settings and summary.

#### `GET /api/workspaces/:id/repos`
List connected repo records for workspace.

#### `POST /api/workspaces/:id/repos`
Create or update the single repo configuration for the workspace.

Request:
```json
{
  "provider": "github",
  "owner": "acme",
  "name": "storefront",
  "defaultBranch": "main"
}
```

### 13.4 GitHub Connection APIs
#### `GET /api/github/connect/start`
Starts GitHub App install/authorization flow.

Query params:
- `workspaceId`

Response:
- redirect to GitHub App installation or auth URL

#### `GET /api/github/connect/callback`
Handles callback after install/auth.
Stores installation metadata for the workspace repo.

#### `POST /api/github/webhook`
Handles GitHub webhooks.
Expected events later:
- installation
- installation_repositories
- pull_request
- check_suite
- push

### 13.5 Health and System APIs
#### `GET /health`
Returns service health.

#### `GET /api/bootstrap`
Phase-specific bootstrap summary for internal debugging.

## 14. Frontend Map
### 14.1 Public Pages
- `/` landing and bug submission entry
- `/report` bug report form
- `/report/:id` intake follow-up and status
- `/thanks/:id` accepted state

### 14.2 Internal Dashboard Pages
- `/dashboard` ticket list
- `/dashboard/tickets/:id` ticket detail
- `/dashboard/tickets/:id/iterations` iteration history
- `/dashboard/settings/repo` repo connection settings
- `/dashboard/settings/workspace` workspace settings

### 14.3 Ticket Detail UI Must Show
- canonical title and summary
- expected behavior
- actual behavior
- repro steps
- environment
- attached reports
- duplicate count
- status timeline
- reproduction run output
- diagnosis summary
- fix iteration summaries
- logs and test output links
- PR link if opened

## 15. GitHub Connection Design
### 15.1 Important Distinction
During development, Codex can work with your repos through your connected tooling and local git workflows.
For the shipped product, the runtime integration should be a real GitHub App, not the Codex connector.

### 15.2 Recommended Product Runtime Model
Use a GitHub App with these capabilities:
- install on selected org or user account
- read repository metadata
- clone repository contents
- create branches
- commit and push changes
- open pull requests
- receive webhooks

### 15.3 Local Development Mode
Use `GITHUB_PROVIDER_MODE=local`.
In local mode:
- the app uses a `LocalGitProvider`
- repo actions operate on a local checkout or sandbox checkout
- PR creation can be simulated or later wired to real GitHub credentials
- this keeps development simple while the orchestration logic is being built

### 15.4 Production Mode
Use `GITHUB_PROVIDER_MODE=github_app`.
In GitHub App mode:
- store `installation_id`
- store repo owner/name/default branch
- use installation tokens for clone/push/PR actions
- handle webhooks for installation and PR lifecycle updates

### 15.5 GitHub Connection Flow
1. workspace admin opens repo settings page
2. frontend calls `GET /api/github/connect/start?workspaceId=...`
3. backend builds GitHub App installation URL
4. user installs the app on target repo
5. GitHub redirects to `/api/github/connect/callback`
6. backend exchanges callback data and records installation metadata
7. repo record becomes active for the workspace
8. worker uses provider to clone/push/open PR

### 15.6 Repo Action Flow
When a fix succeeds:
1. worker requests active repo config
2. `GitProvider` prepares a branch name
3. worker stages and commits generated changes
4. provider pushes branch
5. provider opens PR
6. backend stores `pull_requests` record
7. orchestrator transitions ticket to `PR_OPENED`

## 16. Provider Interfaces
### 16.1 GitProvider
Responsibilities:
- connect repo
- clone or prepare checkout
- create branch
- commit and push
- open PR

Planned interface:
```ts
interface GitProvider {
  mode: 'local' | 'github_app';
  connect(input: ConnectRepoInput): Promise<ConnectRepoResult>;
  prepareCheckout(input: PrepareCheckoutInput): Promise<PrepareCheckoutResult>;
  createBranch(input: CreateBranchInput): Promise<{ branchName: string }>;
  commitAndPush(input: CommitAndPushInput): Promise<{ branchName: string; commitSha: string }>;
  openPullRequest(input: OpenPullRequestInput): Promise<{ prNumber: number; prUrl: string }>;
}
```

### 16.2 ExecutionRunner
Responsibilities:
- create isolated execution environment
- run commands
- manage service startup
- collect logs and artifacts

### 16.3 ArtifactStore
Responsibilities:
- save screenshots
- save logs
- save test output
- save diffs
- return retrievable paths

### 16.4 ModelProvider
Responsibilities:
- call OpenAI API from backend only
- request structured output
- expose tool-enabled agent runs
- record model invocation metadata

### 16.5 AuditLogService
Responsibilities:
- record every state transition
- record repo actions
- record skill runs
- record failures and exit reasons

## 17. Local Run Plan
### 17.1 Prerequisites
- Node.js 20+
- npm 10+
- OpenAI API key for model-backed skills later

### 17.2 Local Environment Variables
Example:
```env
NODE_ENV=development
PORT=4000
WEB_PORT=3000
WORKER_PORT=4500
SQLITE_PATH=./.local/data/bug_agent.sqlite
ARTIFACTS_ROOT=./.local/artifacts
OPENAI_API_KEY=
GITHUB_PROVIDER_MODE=local
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 17.3 Local Startup
```bash
npm install
npm run db:migrate
npm run dev
```

### 17.4 Local Execution Philosophy
For MVP development:
- keep artifacts on local disk
- keep worker execution local in-process
- keep repo operations abstracted
- stub external providers until each phase needs them
- prioritize deterministic local debugging

## 18. Queue and Worker Plan
### 18.1 Initial Queues
- `dedupe-ticket`
- `reproduce-ticket`
- `diagnose-ticket`
- `run-fix-loop`
- `open-pr`

### 18.2 Job Flow
- API accepts request and writes baseline record
- API enqueues background job
- worker loads current state from DB
- worker executes skills and provider actions
- worker writes artifacts and audit events
- orchestrator transitions state

## 19. Audit and Observability
### 19.1 Always Log
- state transitions
- skill executions
- model calls
- tool/provider calls
- repo actions
- PR creation
- loop exits

### 19.2 Metrics to Track
- report volume
- intake completeness score distribution
- duplicate match rate
- reproduction success rate
- average fix iterations
- failure classification counts
- time from report to PR
- PR acceptance rate

## 20. Security Rules
- OpenAI API key stays server-side
- GitHub credentials stay server-side
- no secrets in frontend code
- no secrets in artifacts or logs
- every execution run should be isolated
- temporary repo credentials should be short-lived in production
- PR creation must be blocked if required tests fail

## 21. Testing Plan
### 21.1 Unit Tests
- state transition rules
- priority formula
- dedupe decision rules
- stagnation detection
- PR creation guards

### 21.2 Integration Tests
- report submission creates a bug report
- intake produces a structured ticket
- duplicate report attaches to canonical ticket
- reproduction run persists artifacts
- fix loop stops on failure thresholds

### 21.3 Contract Tests
- `GitProvider`
- `ExecutionRunner`
- `ArtifactStore`
- `ModelProvider`

### 21.4 End-to-End Tests
- submit report through frontend
- answer follow-up intake question
- verify ticket appears in dashboard
- inspect iteration history and logs

## 22. Delivery Phases
### Phase 1: Foundation
Deliver:
- monorepo scaffold
- local Docker services
- root tooling
- package interfaces
- starter web/api/worker apps
- initial skills registry

Status:
- complete

### Phase 2: Core Domain and Persistence
Deliver:
- full schema and migrations
- repositories
- audit persistence
- ticket state machine
- repository configuration persistence

### Phase 3: Public Intake Flow
Deliver:
- bug report form
- attachment upload
- intake chat flow
- report status page
- structured ticket creation stub

### Phase 4: Dedupe and Priority
Deliver:
- candidate search
- duplicate decision flow
- report linking
- priority recalculation
- audit trail for merges

### Phase 5: Reproduction Runner
Deliver:
- checkout prep
- dependency install flow
- service startup flow
- local repro execution
- log and screenshot capture

### Phase 6: Diagnosis and Fix Loop
Deliver:
- diagnosis skill chain
- fix planning skill chain
- implementation placeholders and provider hooks
- testing loop
- safety exits
- iteration persistence

### Phase 7: GitHub Integration
Deliver:
- GitHub App provider
- connect/callback flow
- installation persistence
- branch/push/PR actions
- webhook endpoint handling

### Phase 8: Dashboard and Review Surface
Deliver:
- ticket list
- ticket detail page
- iteration page
- logs viewer
- PR link surfacing

### Phase 9: OpenAI Runtime Integration
Deliver:
- OpenAI-backed model provider
- structured outputs for agent skills
- prompt packages
- model call audit trails

### Phase 10: Hardening
Deliver:
- stronger tests
- better error classification
- improved observability
- stricter security validation
- developer handoff summaries

## 23. Immediate Next Build Target
Recommended next implementation step:
- Phase 2

Concrete work items:
1. define actual database schema in `packages/db`
2. add migration files for core tables
3. implement repository classes for tickets, reports, and audit logs
4. implement ticket state machine in `packages/orchestrator`
5. add tests for state transitions and safety guards

## 24. Build Notes
- The app should remain runnable locally throughout all phases.
- Prefer thin, explicit modules over large general-purpose services.
- Keep GitHub behavior behind the provider interface from the start.
- Keep LLM-backed skills behind structured contracts so they can be stubbed or swapped.
- Do not allow direct PR creation outside orchestrator-approved paths.
- Do not let model output mutate persistent state directly.
