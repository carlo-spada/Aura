import { ThemeToggle } from '../../components/ThemeToggle'
import Link from 'next/link'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex gap-6 py-6">
          {/* Sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-6 rounded-xl border border-neutral-200/10 bg-neutral-900/30 p-4 dark:border-neutral-800">
              <div className="mb-6 flex items-center justify-between">
                <Link href="/" className="text-lg font-semibold">AURA</Link>
                <ThemeToggle />
              </div>
              <nav className="space-y-2 text-sm">
                <AppNavLink href="/dashboard" label="Dashboard" />
                <AppNavLink href="/applications" label="Applications" />
                <AppNavLink href="/tracker" label="Tracker" />
                <AppNavLink href="/history" label="History" />
                <AppNavLink href="/settings" label="Settings" />
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 pb-16 lg:pb-6">{children}</main>
        </div>
      </div>

      {/* Bottom bar on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-around py-2 text-sm">
          <a href="/dashboard" className="px-3 py-2">Dashboard</a>
          <a href="/applications" className="px-3 py-2">Apps</a>
          <a href="/tracker" className="px-3 py-2">Tracker</a>
          <a href="/settings" className="px-3 py-2">Settings</a>
        </div>
      </div>
    </div>
  )
}

function AppNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded px-3 py-2 hover:bg-neutral-800/60">
      {label}
    </Link>
  )
}

