import type { BootstrapSummary } from '@bug-agent/shared';
import { listSkillKeys } from '@bug-agent/skills';

export function createBootstrapSummary(): BootstrapSummary {
  return {
    phase: 2,
    apps: ['web', 'api', 'worker'],
    packages: ['shared', 'config', 'db', 'skills', 'orchestrator', 'github', 'artifacts', 'execution', 'models', 'audit'],
    skills: listSkillKeys(),
    providers: ['git_provider', 'execution_runner', 'artifact_store', 'model_provider', 'audit_log'],
  };
}

export function bootstrapWorker() {
  return {
    name: 'phase-two-worker',
    queues: ['dedupe-ticket', 'reproduce-ticket', 'diagnose-ticket', 'run-fix-loop', 'open-pr'],
  };
}
