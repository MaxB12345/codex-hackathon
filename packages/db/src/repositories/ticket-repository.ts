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
