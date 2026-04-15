import { EMPTY_FIX_REPORT, type FixAgentReport, type FixAgentResponse } from './bug-chat-types';

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

export function normalizeFixAgentResponse(payload: unknown): FixAgentResponse {
  if (!payload || typeof payload !== 'object') {
    return { report: EMPTY_FIX_REPORT };
  }

  const parsed = payload as { report?: Partial<FixAgentReport> };
  const report = parsed.report ?? {};

  return {
    report: {
      executiveSummary: asString(report.executiveSummary, EMPTY_FIX_REPORT.executiveSummary),
      fakeGithubFindings: asStringArray(report.fakeGithubFindings),
      probableRootCause: asString(report.probableRootCause, EMPTY_FIX_REPORT.probableRootCause),
      proposedCodeChanges: asStringArray(report.proposedCodeChanges),
      samplePatch: asString(report.samplePatch, EMPTY_FIX_REPORT.samplePatch),
      validationPlan: asStringArray(report.validationPlan),
      fakeErrorsObserved: asStringArray(report.fakeErrorsObserved),
      pullRequestTitle: asString(report.pullRequestTitle, EMPTY_FIX_REPORT.pullRequestTitle),
      pullRequestBody: asString(report.pullRequestBody, EMPTY_FIX_REPORT.pullRequestBody),
      mergePlan: asString(report.mergePlan, EMPTY_FIX_REPORT.mergePlan),
    },
  };
}
