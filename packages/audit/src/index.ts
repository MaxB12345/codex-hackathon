import type { AuditLogRecord, ActorType } from '@bug-agent/shared';
import type { AuditLogRepository } from './repositories/audit-log-repository.js';

export * from './repositories/audit-log-repository.js';

export interface RecordAuditInput {
  workspaceId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: ActorType;
  metadataJson: Record<string, unknown>;
}

export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  async record(input: RecordAuditInput): Promise<AuditLogRecord> {
    return this.repository.append({
      id: `audit_${input.entityType}_${input.entityId}_${Date.now()}`,
      workspaceId: input.workspaceId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorType: input.actorType,
      metadataJson: input.metadataJson,
      createdAt: new Date().toISOString(),
    });
  }
}
