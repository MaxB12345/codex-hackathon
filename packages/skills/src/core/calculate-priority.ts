import type { Skill } from '../contracts/skill.js';

export interface CalculatePriorityInput {
  severityWeight: number;
  reportCount: number;
  recencyWeight: number;
}

export interface CalculatePriorityOutput {
  priorityScore: number;
}

export const calculatePrioritySkill: Skill<CalculatePriorityInput, CalculatePriorityOutput> = {
  key: 'calculate_priority',
  description: 'Computes the MVP priority score for a canonical ticket.',
  async execute(input) {
    return {
      priorityScore: input.severityWeight + Math.log(input.reportCount + 1) + input.recencyWeight,
    };
  },
};
