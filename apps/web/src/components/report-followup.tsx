'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

interface ReportStatus {
  bugReportId: string;
  ticketId: string | null;
  ticketStatus: string | null;
  structured: {
    completenessScore?: number;
    chat?: { role: 'user' | 'agent'; message: string; createdAt: string }[];
  };
}

export function ReportFollowUp({ bugReportId }: { bugReportId: string }) {
  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [message, setMessage] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [reproSteps, setReproSteps] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/bug-reports/${bugReportId}/status`);
      if (!response.ok) {
        throw new Error('Unable to load report status');
      }
      const data = (await response.json()) as ReportStatus;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load status');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [bugReportId]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/bug-reports/${bugReportId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          expectedBehavior,
          actualBehavior,
          reproSteps: reproSteps
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to save follow-up response');
      }

      setMessage('');
      setExpectedBehavior('');
      setActualBehavior('');
      setReproSteps('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save response');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading report status...</p>;
  }

  if (!status) {
    return <p>Report not found.</p>;
  }

  const chat = status.structured.chat ?? [];
  const structured = status.ticketStatus === 'STRUCTURED';

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <p style={{ margin: 0 }}>
          Ticket status: <strong>{status.ticketStatus ?? 'unknown'}</strong>
        </p>
        <p style={{ margin: 0 }}>
          Completeness score: <strong>{(status.structured.completenessScore ?? 0).toFixed(2)}</strong>
        </p>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Conversation</h3>
        {chat.length === 0 ? <p>No follow-up messages yet.</p> : null}
        {chat.map((entry, index) => (
          <p key={`${entry.createdAt}-${index}`} style={{ margin: '0.5rem 0' }}>
            <strong>{entry.role}:</strong> {entry.message}
          </p>
        ))}
      </div>

      {structured ? (
        <div>
          <p>The report is structured and accepted for engineering triage.</p>
          <Link href={`/thanks/${bugReportId}`}>Open acceptance page</Link>
        </div>
      ) : (
        <form onSubmit={submitMessage} style={{ display: 'grid', gap: '0.8rem' }}>
          <h3 style={{ margin: 0 }}>Add follow-up details</h3>

          <label>
            <span>Message</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} style={{ width: '100%', marginTop: '0.4rem' }} />
          </label>

          <label>
            <span>Expected behavior</span>
            <textarea value={expectedBehavior} onChange={(event) => setExpectedBehavior(event.target.value)} rows={2} style={{ width: '100%', marginTop: '0.4rem' }} />
          </label>

          <label>
            <span>Actual behavior</span>
            <textarea value={actualBehavior} onChange={(event) => setActualBehavior(event.target.value)} rows={2} style={{ width: '100%', marginTop: '0.4rem' }} />
          </label>

          <label>
            <span>Reproduction steps (one per line)</span>
            <textarea value={reproSteps} onChange={(event) => setReproSteps(event.target.value)} rows={4} style={{ width: '100%', marginTop: '0.4rem' }} />
          </label>

          {error ? <p style={{ color: '#8b1f0d', margin: 0 }}>{error}</p> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Submit follow-up'}
          </button>
        </form>
      )}
    </section>
  );
}
