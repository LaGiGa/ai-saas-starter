import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'AI SaaS Starter - Next.js + Supabase + OpenAI',
  description: 'AI SaaS Starter com Next.js (App Router), Supabase Auth & PostgreSQL, OpenAI Streaming e controle de cotas.',
  openGraph: {
    title: 'AI SaaS Starter - Next.js + Supabase + OpenAI',
    description: 'AI SaaS Starter com Next.js (App Router), Supabase Auth & PostgreSQL, OpenAI Streaming e controle de cotas.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI SaaS Starter - Next.js + Supabase + OpenAI',
    description: 'AI SaaS Starter com Next.js (App Router), Supabase Auth & PostgreSQL, OpenAI Streaming e controle de cotas.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
