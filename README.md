# AI Bug Resolution Agent

Local-first monorepo scaffold for an AI-powered bug reporting, triage, reproduction, diagnosis, fixing, testing, and PR creation system.

## Current prototype profile
- SQLite for local persistence
- no Redis requirement
- no Docker requirement
- single-command local development after install/migrate

## Prerequisites
- Node.js 20+
- npm 10+

## Local development
1. Copy `.env.example` to `.env` and fill in required values.
2. Install dependencies:
   `npm install`
3. Run migrations:
   `npm run db:migrate`
4. Start the apps:
   `npm run dev`

## Workspace layout
- `apps/web`: Next.js frontend for public submission and internal dashboard
- `apps/api`: Node.js API backend and orchestration entrypoints
- `apps/worker`: background workers for long-running jobs
- `packages/*`: shared domain modules, skill contracts, and infrastructure abstractions
- `docs/prd.md`: product source of truth
- `docs/plan.md`: architecture and endpoint map
- `AGENTS.md`: implementation rules and safety constraints

## Current status
Phase 2 core domain is in place with a guarded ticket state machine, schema/migration artifacts, and SQLite-first prototype direction.
