import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AURA',
  description: 'Autonomous Up-skilling & Role-Acquisition',
  manifest: '/manifest.json',
  themeColor: '#0b0f19',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-6xl p-4">
          <header className="py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">AURA</h1>
            <nav className="text-sm opacity-80">
              <a className="mr-4 hover:opacity-100" href="/">Jobs</a>
              <a className="mr-4 hover:opacity-100" href="/search">Search</a>
              <a className="hover:opacity-100" href="/saved">Saved</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}

