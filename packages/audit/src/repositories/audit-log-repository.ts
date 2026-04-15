import type Database from 'better-sqlite3';
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

export class SqliteAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: Database.Database) {}

  async append(event: AuditLogRecord): Promise<AuditLogRecord> {
    this.db
      .prepare(
        `insert into audit_logs (
          id, workspace_id, entity_type, entity_id, action, actor_type, metadata_json, created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        event.id,
        event.workspaceId,
        event.entityType,
        event.entityId,
        event.action,
        event.actorType,
        JSON.stringify(event.metadataJson),
        event.createdAt,
      );
    return event;
  }

  async listByEntity(entityType: string, entityId: string): Promise<AuditLogRecord[]> {
    const rows = this.db
      .prepare(
        `select id, workspace_id, entity_type, entity_id, action, actor_type, metadata_json, created_at
         from audit_logs
         where entity_type = ? and entity_id = ?
         order by created_at asc`,
      )
      .all(entityType, entityId) as {
      id: string;
      workspace_id: string;
      entity_type: string;
      entity_id: string;
      action: string;
      actor_type: AuditLogRecord['actorType'];
      metadata_json: string;
      created_at: string;
    }[];

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      actorType: row.actor_type,
      metadataJson: JSON.parse(row.metadata_json),
      createdAt: row.created_at,
    }));
  }
}
