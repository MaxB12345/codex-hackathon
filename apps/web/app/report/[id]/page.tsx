import { ReportFollowUp } from '../../../src/components/report-followup';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main style={{ maxWidth: '52rem', margin: '3rem auto', padding: '0 1rem' }}>
      <h1>Report intake</h1>
      <p style={{ color: 'var(--muted)' }}>Report ID: {id}</p>
      <ReportFollowUp bugReportId={id} />
    </main>
  );
}
