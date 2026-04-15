import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bug Reporter Chat Prototype',
  description: 'Chatbot-style bug intake prototype with mocked agent follow-up responses.',
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
