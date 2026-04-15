import { ReportForm } from '../../src/components/report-form';

export default function ReportPage() {
  return (
    <main style={{ maxWidth: '52rem', margin: '3rem auto', padding: '0 1rem' }}>
      <h1>Submit a bug report</h1>
      <p style={{ color: 'var(--muted)' }}>
        Describe the issue and include screenshots. The intake agent will ask follow-up questions if required.
      </p>
      <ReportForm />
    </main>
  );
}
