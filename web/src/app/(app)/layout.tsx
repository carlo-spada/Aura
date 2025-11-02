import { ThemeToggle } from '../../components/ThemeToggle'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { BatchProvider } from '../../components/BatchContext'
import Link from 'next/link'
import { useI18n } from '../../components/I18nProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex gap-6 py-6">
          {/* Sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-6 rounded-xl border border-neutral-200/10 bg-neutral-900/30 p-4 dark:border-neutral-800">
              <div className="mb-6 flex items-center justify-between gap-3">
                <Link href="/" className="text-lg font-semibold">AURA</Link>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>
              <nav className="space-y-2 text-sm">
                <AppNavLink href="/dashboard" label={t('nav_dashboard')} />
                <AppNavLink href="/applications" label={t('nav_applications')} />
                <AppNavLink href="/tracker" label={t('nav_tracker')} />
                <AppNavLink href="/history" label={t('nav_history')} />
                <AppNavLink href="/settings" label={t('nav_settings')} />
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 pb-16 lg:pb-6">
            <BatchProvider>{children}</BatchProvider>
          </main>
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
