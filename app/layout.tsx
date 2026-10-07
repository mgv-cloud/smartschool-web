import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartSchool AI',
  description: 'The Intelligent Operating System for Modern Schools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
