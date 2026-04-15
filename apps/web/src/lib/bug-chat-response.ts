import { EMPTY_SNAPSHOT, type BugChatResponse, type BugIntakeSnapshot } from './bug-chat-types';

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function asCompleteness(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return EMPTY_SNAPSHOT.completeness;
  }
  return Math.max(0, Math.min(1, value));
}

export function normalizeBugChatResponse(payload: unknown): BugChatResponse {
  if (!payload || typeof payload !== 'object') {
    return {
      reply: 'I could not parse structured details yet. Please share more about the issue.',
      snapshot: EMPTY_SNAPSHOT,
    };
  }

  const parsed = payload as {
    reply?: unknown;
    snapshot?: Partial<BugIntakeSnapshot>;
  };

  const snapshot = parsed.snapshot ?? {};
  const normalized: BugIntakeSnapshot = {
    title: asString(snapshot.title, EMPTY_SNAPSHOT.title),
    description: asString(snapshot.description, EMPTY_SNAPSHOT.description),
    stepsToReproduce: asStringArray(snapshot.stepsToReproduce),
    expectedBehavior: asString(snapshot.expectedBehavior, EMPTY_SNAPSHOT.expectedBehavior),
    actualBehavior: asString(snapshot.actualBehavior, EMPTY_SNAPSHOT.actualBehavior),
    device: asString(snapshot.device, EMPTY_SNAPSHOT.device),
    operatingSystem: asString(snapshot.operatingSystem, EMPTY_SNAPSHOT.operatingSystem),
    browser: asString(snapshot.browser, EMPTY_SNAPSHOT.browser),
    browserVersion: asString(snapshot.browserVersion, EMPTY_SNAPSHOT.browserVersion),
    evidence: asString(snapshot.evidence, EMPTY_SNAPSHOT.evidence),
    frequency: asString(snapshot.frequency, EMPTY_SNAPSHOT.frequency),
    additionalNotes: asString(snapshot.additionalNotes, EMPTY_SNAPSHOT.additionalNotes),
    completeness: asCompleteness(snapshot.completeness),
    missingFields: asStringArray(snapshot.missingFields),
  };

  return {
    reply: asString(parsed.reply, 'Thanks. Can you share a bit more detail so I can reproduce the issue?'),
    snapshot: normalized,
  };
}

export function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
