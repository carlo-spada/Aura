import "./globals.css";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AURA - AI-Powered Job Copilot',
  description: 'Your intelligent companion for finding and applying to perfect job matches',
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}