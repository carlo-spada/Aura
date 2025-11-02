import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '../components/ThemeProvider'

export const metadata: Metadata = {
  title: 'AURA',
  description: 'Autonomous Up-skilling & Role-Acquisition',
  manifest: '/manifest.json',
  themeColor: '#0b0f19',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )}
