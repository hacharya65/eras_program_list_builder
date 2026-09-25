import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internal ERAS Advising & Strategy Portal | Apex School of Medicine',
  description: 'Clinical-grade pre-season residency application advising, drafting sandbox, and strategic review platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
