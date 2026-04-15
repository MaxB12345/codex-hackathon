import { calculatePrioritySkill } from './calculate-priority.js';

export interface DedupeTicketInput {
  sourceTitle: string;
  sourceSummary: string;
  sourceReproSteps: string[];
  candidateTickets: {
    id: string;
    title: string;
    summary: string;
  }[];
  threshold?: number;
}

export interface DedupeTicketOutput {
  duplicateOfTicketId: string | null;
  confidenceScore: number;
  rationale: string;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function findDuplicateTicket(input: DedupeTicketInput): DedupeTicketOutput {
  const threshold = input.threshold ?? 0.68;
  const sourceTokens = tokenize(
    `${input.sourceTitle} ${input.sourceSummary} ${input.sourceReproSteps.join(' ')}`,
  );

  let best: { ticketId: string; score: number } | null = null;

  for (const candidate of input.candidateTickets) {
    const candidateTokens = tokenize(`${candidate.title} ${candidate.summary}`);
    const score = jaccard(sourceTokens, candidateTokens);

    if (!best || score > best.score) {
      best = { ticketId: candidate.id, score };
    }
  }

  if (!best || best.score < threshold) {
    return {
      duplicateOfTicketId: null,
      confidenceScore: best?.score ?? 0,
      rationale: 'No candidate crossed the dedupe confidence threshold.',
    };
  }

  return {
    duplicateOfTicketId: best.ticketId,
    confidenceScore: best.score,
    rationale: `Ticket ${best.ticketId} had the highest semantic token overlap.`,
  };
}

export interface PriorityInput {
  severity: 1 | 2 | 3 | 4;
  reportCount: number;
  createdAtIso: string;
  nowIso?: string;
}

export async function computePriorityScore(input: PriorityInput): Promise<number> {
  const now = input.nowIso ? new Date(input.nowIso) : new Date();
  const createdAt = new Date(input.createdAtIso);
  const ageHours = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));

  let recencyWeight = 0;
  if (ageHours <= 24) {
    recencyWeight = 0.6;
  } else if (ageHours <= 72) {
    recencyWeight = 0.35;
  } else if (ageHours <= 168) {
    recencyWeight = 0.15;
  }

  const { priorityScore } = await calculatePrioritySkill.execute(
    {
      severityWeight: input.severity,
      reportCount: input.reportCount,
      recencyWeight,
    },
    { actor: 'api' },
  );

  return priorityScore;
}
