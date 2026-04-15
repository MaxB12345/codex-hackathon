import type Database from 'better-sqlite3';
import type { TicketRecord, TicketStateTransition } from '@bug-agent/shared';

export interface TicketRepository {
  create(ticket: TicketRecord): Promise<TicketRecord>;
  getById(id: string): Promise<TicketRecord | null>;
  update(ticket: TicketRecord): Promise<TicketRecord>;
  listTransitions(ticketId: string): Promise<TicketStateTransition[]>;
  appendTransition(transition: TicketStateTransition): Promise<TicketStateTransition>;
}

export class InMemoryTicketRepository implements TicketRepository {
  private tickets = new Map<string, TicketRecord>();
  private transitions = new Map<string, TicketStateTransition[]>();

  async create(ticket: TicketRecord): Promise<TicketRecord> {
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async getById(id: string): Promise<TicketRecord | null> {
    return this.tickets.get(id) ?? null;
  }

  async update(ticket: TicketRecord): Promise<TicketRecord> {
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async listTransitions(ticketId: string): Promise<TicketStateTransition[]> {
    return this.transitions.get(ticketId) ?? [];
  }

  async appendTransition(transition: TicketStateTransition): Promise<TicketStateTransition> {
    const current = this.transitions.get(transition.ticketId) ?? [];
    current.push(transition);
    this.transitions.set(transition.ticketId, current);
    return transition;
  }
}

export class SqliteTicketRepository implements TicketRepository {
  constructor(private readonly db: Database.Database) {}

  async create(ticket: TicketRecord): Promise<TicketRecord> {
    const statement = this.db.prepare(
      `insert into tickets (
        id, workspace_id, title, summary, status, severity, priority_score, report_count, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    statement.run(
      ticket.id,
      ticket.workspaceId,
      ticket.title,
      ticket.summary,
      ticket.status,
      ticket.severity,
      ticket.priorityScore,
      ticket.reportCount,
      ticket.createdAt,
      ticket.updatedAt,
    );
    return ticket;
  }

  async getById(id: string): Promise<TicketRecord | null> {
    const row = this.db
      .prepare(
        `select id, workspace_id, title, summary, status, severity, priority_score, report_count, created_at, updated_at
         from tickets where id = ?`,
      )
      .get(id) as
      | {
          id: string;
          workspace_id: string;
          title: string;
          summary: string;
          status: TicketRecord['status'];
          severity: number;
          priority_score: number;
          report_count: number;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title,
      summary: row.summary,
      status: row.status,
      severity: row.severity as 1 | 2 | 3 | 4,
      priorityScore: row.priority_score,
      reportCount: row.report_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async update(ticket: TicketRecord): Promise<TicketRecord> {
    this.db
      .prepare(
        `update tickets
         set title = ?, summary = ?, status = ?, severity = ?, priority_score = ?, report_count = ?, updated_at = ?
         where id = ?`,
      )
      .run(
        ticket.title,
        ticket.summary,
        ticket.status,
        ticket.severity,
        ticket.priorityScore,
        ticket.reportCount,
        ticket.updatedAt,
        ticket.id,
      );
    return ticket;
  }

  async listTransitions(ticketId: string): Promise<TicketStateTransition[]> {
    const rows = this.db
      .prepare(
        `select ticket_id, from_status, to_status, actor_type, reason_code, summary, created_at
         from ticket_events
         where ticket_id = ?
         order by created_at asc`,
      )
      .all(ticketId) as {
      ticket_id: string;
      from_status: TicketStateTransition['from'];
      to_status: TicketStateTransition['to'];
      actor_type: TicketStateTransition['actorType'];
      reason_code: string;
      summary: string;
      created_at: string;
    }[];

    return rows.map((row) => ({
      ticketId: row.ticket_id,
      from: row.from_status,
      to: row.to_status,
      actorType: row.actor_type,
      reasonCode: row.reason_code,
      summary: row.summary,
      createdAt: row.created_at,
    }));
  }

  async appendTransition(transition: TicketStateTransition): Promise<TicketStateTransition> {
    this.db
      .prepare(
        `insert into ticket_events (
          id, ticket_id, from_status, to_status, reason_code, summary, actor_type, created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        `event_${transition.ticketId}_${Date.now()}`,
        transition.ticketId,
        transition.from,
        transition.to,
        transition.reasonCode,
        transition.summary,
        transition.actorType,
        transition.createdAt,
      );
    return transition;
  }
}
