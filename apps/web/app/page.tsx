import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', marginBottom: '0.6rem' }}>AI Bug Resolution Agent</h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
        Phase 3 intake prototype is live. Submit a report, upload screenshots, answer follow-up questions, and track intake status.
      </p>
      <Link href="/report" style={{ display: 'inline-block', marginTop: '1rem' }}>
        Open bug report form
      </Link>
    </main>
  );
}
