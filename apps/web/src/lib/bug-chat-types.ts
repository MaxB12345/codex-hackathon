export type ChatRole = 'user' | 'agent';

export interface ChatMessage {
  role: ChatRole;
  message: string;
  createdAt: string;
}

export interface BugIntakeSnapshot {
  title: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  device: string;
  operatingSystem: string;
  browser: string;
  browserVersion: string;
  evidence: string;
  frequency: string;
  additionalNotes: string;
  completeness: number;
  missingFields: string[];
}

export interface BugChatResponse {
  reply: string;
  snapshot: BugIntakeSnapshot;
}

export const EMPTY_SNAPSHOT: BugIntakeSnapshot = {
  title: 'Untitled bug report',
  description: 'Not provided yet',
  stepsToReproduce: [],
  expectedBehavior: 'Not provided yet',
  actualBehavior: 'Not provided yet',
  device: 'Unknown',
  operatingSystem: 'Unknown',
  browser: 'Unknown',
  browserVersion: 'Unknown',
  evidence: 'None yet',
  frequency: 'Not stated',
  additionalNotes: 'None yet',
  completeness: 0,
  missingFields: [
    'title',
    'description',
    'stepsToReproduce',
    'expectedBehavior',
    'actualBehavior',
    'device',
    'operatingSystem',
    'browser',
    'frequency',
  ],
};
