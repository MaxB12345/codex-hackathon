# AI Bug Resolution Agent

Local-first monorepo scaffold for an AI-powered bug reporting, triage, reproduction, diagnosis, fixing, testing, and PR creation system.

## Phase 1 scope
- Monorepo scaffold for `apps/web`, `apps/api`, and `apps/worker`
- Shared TypeScript configuration and workspace tooling
- Initial skill registry and orchestrator contracts
- Local development Docker services for Postgres and Redis
- Backend-first interfaces for model, execution, artifact, audit, and GitHub providers

## Prerequisites
- Node.js 20+
- npm 10+
- Docker

## Local development
1. Copy `.env.example` to `.env` and fill in required values.
2. Start local services:
   `docker compose -f docker/docker-compose.dev.yml up -d`
3. Install dependencies:
   `npm install`
4. Run migrations:
   `npm run db:migrate`
5. Start the apps:
   `npm run dev`

## Workspace layout
- `apps/web`: Next.js frontend for public submission and internal dashboard
- `apps/api`: Node.js API backend and orchestration entrypoints
- `apps/worker`: background workers for long-running jobs
- `packages/*`: shared domain modules, skill contracts, and infrastructure abstractions
- `docs/prd.md`: product source of truth
- `AGENTS.md`: implementation rules and safety constraints

## Current status
Phase 1 scaffold is in place. Most business capabilities are placeholders pending Phase 2 and beyond.
