# AI Bug Resolution Agent PRD

This document is the source of truth for the MVP. The detailed PRD content provided during product definition should be kept here and expanded as implementation evolves.

## Phase 1 status
- Monorepo scaffolded for local-first development
- Skills-first backend architecture established
- GitHub integration abstracted behind provider interfaces
- OpenAI-backed agent execution reserved for backend-only implementations

## Core architectural constraints
- TypeScript throughout
- Single repo per workspace in MVP
- Local development should run with a single root dev command after dependencies and local services are started
- All side effects must go through backend service interfaces
- Orchestrator owns ticket state transitions
