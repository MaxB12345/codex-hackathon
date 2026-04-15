'use client';

import { FormEvent, useState } from 'react';
import {
  EMPTY_FIX_REPORT,
  EMPTY_SNAPSHOT,
  type BugChatResponse,
  type ChatMessage,
  type FixAgentResponse,
} from '../lib/bug-chat-types';

function createInitialConversation(): ChatMessage[] {
  return [
    {
      role: 'agent',
      message:
        'Hi, I am the bug intake agent. Tell me what bug you found and I will gather all details needed for developers to reproduce and fix it.',
      createdAt: new Date(0).toISOString(),
    },
  ];
}

function createMessage(role: ChatMessage['role'], message: string): ChatMessage {
  return {
    role,
    message,
    createdAt: new Date().toISOString(),
  };
}

export function BugIntakeChat({ heading = 'Bug Intake Chat' }: { heading?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => createInitialConversation());
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [fixReport, setFixReport] = useState(EMPTY_FIX_REPORT);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || typing || fixing) {
      return;
    }

    setError(null);
    const userMessage = createMessage('user', trimmed);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setTyping(true);

    try {
      const response = await fetch('/agent-api/bug-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to generate intake response.');
      }

      const intake = (await response.json()) as BugChatResponse;
      const withAgent = [...nextMessages, createMessage('agent', intake.reply)];
      setMessages(withAgent);
      setSnapshot(intake.snapshot);
      setTyping(false);
      setFixing(true);

      const fixResponse = await fetch('/agent-api/fix-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: withAgent, snapshot: intake.snapshot }),
      });

      if (!fixResponse.ok) {
        const payload = (await fixResponse.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to generate fix-agent output.');
      }

      const fixPayload = (await fixResponse.json()) as FixAgentResponse;
      setFixReport(fixPayload.report);
      setMessages((prev) => [
        ...prev,
        createMessage(
          'agent',
          `Fix agent simulation complete. Draft PR prepared: ${fixPayload.report.pullRequestTitle}`,
        ),
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to reach agent API. Check server logs.';
      setError(message);
      setMessages((prev) => [
        ...prev,
        createMessage(
          'agent',
          'I could not generate a response right now. Please verify OPENAI_API_KEY is set and try again.',
        ),
      ]);
    } finally {
      setTyping(false);
      setFixing(false);
    }
  }

  return (
    <main className="chat-shell">
      <section className="chat-panel">
        <header className="chat-header">
          <p className="eyebrow">Two-Agent Prototype</p>
          <h1>{heading}</h1>
          <p>
            Intake agent captures bug details, then a second synthetic fix agent fabricates diagnosis, code edits,
            and PR output.
          </p>
        </header>

        <div className="chat-log" aria-live="polite">
          {messages.map((entry, index) => (
            <article key={`${entry.createdAt}-${index}`} className={`bubble ${entry.role}`}>
              <p className="bubble-role">{entry.role === 'agent' ? 'Agent' : 'You'}</p>
              <p>{entry.message}</p>
            </article>
          ))}
          {typing ? (
            <article className="bubble agent">
              <p className="bubble-role">Intake Agent</p>
              <p>Collecting structured details...</p>
            </article>
          ) : null}
          {fixing ? (
            <article className="bubble agent">
              <p className="bubble-role">Fix Agent</p>
              <p>Fabricating GitHub findings, code diff, and PR summary...</p>
            </article>
          ) : null}
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <label htmlFor="message" className="sr-only">
            Describe your bug
          </label>
          <textarea
            id="message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Example: Save button does nothing on mobile checkout page..."
          />
          <button type="submit" disabled={typing || fixing || draft.trim().length < 4}>
            Send
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>

      <aside className="summary-panel">
        <h2>Structured Intake</h2>
        <p className="summary-note">Extracted by the intake agent from your conversation.</p>
        <dl>
          <div>
            <dt>Title</dt>
            <dd>{snapshot.title}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{snapshot.description}</dd>
          </div>
          <div>
            <dt>Steps to Reproduce</dt>
            <dd>{snapshot.stepsToReproduce.length > 0 ? snapshot.stepsToReproduce.join(' | ') : 'Not provided yet'}</dd>
          </div>
          <div>
            <dt>Expected</dt>
            <dd>{snapshot.expectedBehavior}</dd>
          </div>
          <div>
            <dt>Actual</dt>
            <dd>{snapshot.actualBehavior}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>
              {snapshot.device} / {snapshot.operatingSystem} / {snapshot.browser} {snapshot.browserVersion}
            </dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>{snapshot.evidence}</dd>
          </div>
          <div>
            <dt>Frequency</dt>
            <dd>{snapshot.frequency}</dd>
          </div>
          <div>
            <dt>Additional Notes</dt>
            <dd>{snapshot.additionalNotes}</dd>
          </div>
          <div>
            <dt>Completeness</dt>
            <dd>{Math.round(snapshot.completeness * 100)}%</dd>
          </div>
          <div>
            <dt>Missing Fields</dt>
            <dd>{snapshot.missingFields.length > 0 ? snapshot.missingFields.join(', ') : 'None'}</dd>
          </div>
        </dl>

        <h2 className="fix-title">Fix Agent (Synthetic)</h2>
        <p className="summary-note">Everything below is intentionally fabricated for demo purposes.</p>
        <dl>
          <div>
            <dt>Executive Summary</dt>
            <dd>{fixReport.executiveSummary}</dd>
          </div>
          <div>
            <dt>Fake Errors From GitHub</dt>
            <dd>{fixReport.fakeErrorsObserved.length > 0 ? fixReport.fakeErrorsObserved.join(' | ') : 'Pending'}</dd>
          </div>
          <div>
            <dt>Fake GitHub Findings</dt>
            <dd>{fixReport.fakeGithubFindings.length > 0 ? fixReport.fakeGithubFindings.join(' | ') : 'Pending'}</dd>
          </div>
          <div>
            <dt>Probable Root Cause</dt>
            <dd>{fixReport.probableRootCause}</dd>
          </div>
          <div>
            <dt>Proposed Code Changes</dt>
            <dd>{fixReport.proposedCodeChanges.length > 0 ? fixReport.proposedCodeChanges.join(' | ') : 'Pending'}</dd>
          </div>
          <div>
            <dt>Sample Patch</dt>
            <dd>
              <pre className="code-block">{fixReport.samplePatch}</pre>
            </dd>
          </div>
          <div>
            <dt>Validation Plan</dt>
            <dd>{fixReport.validationPlan.length > 0 ? fixReport.validationPlan.join(' | ') : 'Pending'}</dd>
          </div>
          <div>
            <dt>PR Title</dt>
            <dd>{fixReport.pullRequestTitle}</dd>
          </div>
          <div>
            <dt>PR Body</dt>
            <dd>{fixReport.pullRequestBody}</dd>
          </div>
          <div>
            <dt>Merge Plan</dt>
            <dd>{fixReport.mergePlan}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}
