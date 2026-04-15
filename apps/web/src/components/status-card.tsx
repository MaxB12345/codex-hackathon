const capabilities = [
  'Public bug intake with screenshot upload',
  'Internal dashboard for tickets and iterations',
  'Skills-first orchestrator and provider interfaces',
  'Local-first execution with Docker-backed dependencies',
];

export function StatusCard() {
  return (
    <section
      style={{
        maxWidth: '56rem',
        margin: '4rem auto',
        padding: '2rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        boxShadow: '0 24px 60px rgba(28, 26, 24, 0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)' }}>
        Phase 1
      </p>
      <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', margin: '0 0 1rem' }}>
        AI Bug Resolution Agent
      </h1>
      <p style={{ fontSize: '1.125rem', lineHeight: 1.7, color: 'var(--muted)' }}>
        The monorepo scaffold is active. Phase 1 establishes the local development surface,
        provider boundaries, and skill contracts required for the later reproduction and fix
        loop phases.
      </p>
      <ul style={{ marginTop: '1.5rem', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
        {capabilities.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
