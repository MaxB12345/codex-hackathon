export interface AuditLogEvent {
  entityType: string;
  entityId: string;
  action: string;
  actorType: 'system' | 'user' | 'worker';
}

export class AuditLogService {
  async record(event: AuditLogEvent): Promise<AuditLogEvent> {
    return event;
  }
}
