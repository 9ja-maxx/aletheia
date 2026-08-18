import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aletheia — The Evidence-Grounded Debate Arena',
  description:
    'A decentralised on-chain coliseum where claims are adjudicated by verifiable evidence, not rhetoric. Powered by GenLayer intelligent contracts.',
  keywords: ['Aletheia', 'GenLayer', 'debate', 'blockchain', 'AI adjudication', 'fact-check', 'evidence'],
  openGraph: {
    title: 'Aletheia',
    description: 'The Evidence-Grounded Debate Arena on GenLayer',
    type: 'website',
    siteName: 'Aletheia',
  },
  themeColor: '#08090d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="grid-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
