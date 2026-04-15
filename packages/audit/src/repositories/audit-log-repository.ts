import type { AuditLogRecord } from '@bug-agent/shared';

export interface AuditLogRepository {
  append(event: AuditLogRecord): Promise<AuditLogRecord>;
  listByEntity(entityType: string, entityId: string): Promise<AuditLogRecord[]>;
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private events: AuditLogRecord[] = [];

  async append(event: AuditLogRecord): Promise<AuditLogRecord> {
    this.events.push(event);
    return event;
  }

  async listByEntity(entityType: string, entityId: string): Promise<AuditLogRecord[]> {
    return this.events.filter((event) => event.entityType === entityType && event.entityId === entityId);
  }
}
