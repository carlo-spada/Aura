import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '../components/ThemeProvider'
import { AuthProvider } from '../components/AuthProvider'

export const metadata: Metadata = {
  title: 'AURA',
  description: 'Autonomous Up-skilling & Role-Acquisition',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0b0f19',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )}
