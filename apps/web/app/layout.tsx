import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Bug Resolution Agent',
  description: 'Local-first MVP scaffold for bug intake and autonomous fix workflows.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
