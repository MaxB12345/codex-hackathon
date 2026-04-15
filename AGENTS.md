# AGENTS.md

## Project context
This repository implements an AI-powered bug reporting and fixing platform for web and backend applications.

## Product rules
- Follow docs/prd.md as source of truth
- Single repo per workspace in MVP
- Every fix must include tests
- Do not open PR if tests fail
- Do not allow infinite fix loops
- All state transitions must be auditable

## Engineering rules
- Use TypeScript throughout
- Keep modules small and explicit
- Prefer service-layer architecture
- Avoid unnecessary dependencies
- Write migrations for schema changes
- Keep backend side effects behind service interfaces
- Add tests for critical flows

## Critical safety rules
- Never expose secrets to the frontend
- Never perform GitHub actions outside service layer
- Never bypass fix loop exit conditions
- Never create a PR unless all required tests pass
- Always persist iteration history

## Required core modules
- ticket orchestrator
- dedupe service
- reproduction runner
- diagnosis service
- fix planning service
- implementation service
- testing service
- GitHub service
- audit log service

## Frontend requirements
- public bug submission page
- internal dashboard
- ticket detail page
- iteration history page
- repo connection page

## Testing requirements
- test state transitions
- test deduplication behavior
- test fix loop exit conditions
- test PR creation guards
