import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Austin OSSF Tool',
  description: 'Internal Austin-area OSSF lead intelligence platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
