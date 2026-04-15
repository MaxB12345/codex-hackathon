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

export interface FixAgentReport {
  executiveSummary: string;
  fakeGithubFindings: string[];
  probableRootCause: string;
  proposedCodeChanges: string[];
  samplePatch: string;
  validationPlan: string[];
  fakeErrorsObserved: string[];
  pullRequestTitle: string;
  pullRequestBody: string;
  mergePlan: string;
}

export interface FixAgentResponse {
  report: FixAgentReport;
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

export const EMPTY_FIX_REPORT: FixAgentReport = {
  executiveSummary: 'Fix agent has not run yet.',
  fakeGithubFindings: [],
  probableRootCause: 'Not analyzed yet.',
  proposedCodeChanges: [],
  samplePatch: '// no patch yet',
  validationPlan: [],
  fakeErrorsObserved: [],
  pullRequestTitle: 'chore: pending fix simulation',
  pullRequestBody: 'Fix agent output will appear after intake details are captured.',
  mergePlan: 'No merge plan yet.',
};
