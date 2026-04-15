import type { Skill } from '../contracts/skill.js';

export interface CreateTicketInput {
  title: string;
  summary: string;
}

export interface CreateTicketOutput {
  ticketId: string;
  title: string;
  summary: string;
}

export const createTicketSkill: Skill<CreateTicketInput, CreateTicketOutput> = {
  key: 'create_ticket',
  description: 'Creates a canonical ticket placeholder from structured intake data.',
  async execute(input) {
    return {
      ticketId: `ticket_${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      title: input.title,
      summary: input.summary,
    };
  },
};
