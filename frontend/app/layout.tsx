import type { Metadata } from 'next';
import './globals.css';
import MusicInitializer from './MusicInitializer';

export const metadata: Metadata = {
  title: 'Aegis Kingdoms | Persistent Strategy MMORPG',
  description: 'Govern nations, establish markets, wage war, and trade resources in a living virtual society.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
        <MusicInitializer />
        {children}
      </body>
    </html>
  );
}
