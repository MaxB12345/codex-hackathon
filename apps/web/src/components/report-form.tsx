'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function ReportForm() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [steps, setSteps] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDisabled = useMemo(() => submitting || description.trim().length < 8, [description, submitting]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/bug-reports`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws_local',
          message: description,
          expectedBehavior,
          actualBehavior,
          stepsTried: steps
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create bug report');
      }

      const created = (await response.json()) as { bugReportId: string };

      if (files && files.length > 0) {
        for (const file of Array.from(files)) {
          const contentBase64 = await fileToBase64(file);
          await fetch(`${API_BASE}/api/bug-reports/${created.bugReportId}/attachments`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || 'application/octet-stream',
              contentBase64,
            }),
          });
        }
      }

      router.push(`/report/${created.bugReportId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
      <label>
        <span>Bug description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          rows={5}
          style={{ width: '100%', marginTop: '0.4rem' }}
          placeholder="What happened?"
        />
      </label>

      <label>
        <span>Expected behavior</span>
        <textarea
          value={expectedBehavior}
          onChange={(event) => setExpectedBehavior(event.target.value)}
          rows={2}
          style={{ width: '100%', marginTop: '0.4rem' }}
        />
      </label>

      <label>
        <span>Actual behavior</span>
        <textarea
          value={actualBehavior}
          onChange={(event) => setActualBehavior(event.target.value)}
          rows={2}
          style={{ width: '100%', marginTop: '0.4rem' }}
        />
      </label>

      <label>
        <span>Steps tried (one per line)</span>
        <textarea
          value={steps}
          onChange={(event) => setSteps(event.target.value)}
          rows={4}
          style={{ width: '100%', marginTop: '0.4rem' }}
        />
      </label>

      <label>
        <span>Screenshots</span>
        <input type="file" accept="image/*" multiple onChange={(event) => setFiles(event.target.files)} />
      </label>

      {error ? <p style={{ color: '#8b1f0d', margin: 0 }}>{error}</p> : null}

      <button type="submit" disabled={submitDisabled}>
        {submitting ? 'Submitting...' : 'Submit bug report'}
      </button>
    </form>
  );
}
