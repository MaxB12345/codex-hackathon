'use client';

import { FormEvent, useState } from 'react';
import { EMPTY_SNAPSHOT, type BugChatResponse, type ChatMessage } from '../lib/bug-chat-types';

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
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || typing) {
      return;
    }

    setError(null);
    const nextMessages = [...messages, createMessage('user', trimmed)];
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
        throw new Error(payload.error ?? 'Failed to generate agent response.');
      }

      const payload = (await response.json()) as BugChatResponse;
      setMessages((prev) => [...prev, createMessage('agent', payload.reply)]);
      setSnapshot(payload.snapshot);
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
    }
  }

  return (
    <main className="chat-shell">
      <section className="chat-panel">
        <header className="chat-header">
          <p className="eyebrow">Live Agent</p>
          <h1>{heading}</h1>
          <p>Chat with the intake agent to capture complete bug details for developers.</p>
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
              <p className="bubble-role">Agent</p>
              <p>Thinking...</p>
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
          <button type="submit" disabled={typing || draft.trim().length < 4}>
            Send
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>

      <aside className="summary-panel">
        <h2>Structured Intake</h2>
        <p className="summary-note">Extracted by the live agent from your conversation.</p>
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
      </aside>
    </main>
  );
}
