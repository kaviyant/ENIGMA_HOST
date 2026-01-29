import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ENIGMA',
  description: 'Online Competition Terminal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden selection:bg-green-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
