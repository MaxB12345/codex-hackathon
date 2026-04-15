import Link from 'next/link';

export default async function ThanksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main style={{ maxWidth: '52rem', margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Report accepted</h1>
      <p style={{ color: 'var(--muted)' }}>
        Report <code>{id}</code> has been captured and converted into a structured engineering ticket.
      </p>
      <Link href={`/report/${id}`}>Back to report status</Link>
    </main>
  );
}
