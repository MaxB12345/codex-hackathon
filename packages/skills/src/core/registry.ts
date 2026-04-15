import { calculatePrioritySkill } from './calculate-priority.js';
import { createTicketSkill } from './create-ticket.js';

export const phaseOneSkills = [createTicketSkill, calculatePrioritySkill];

export function listSkillKeys(): string[] {
  return [...phaseOneSkills.map((skill) => skill.key), 'search_similar_tickets', 'calculate_priority_score'];
}
