import Link from 'next/link'
import { useI18n } from '../components/I18nProvider'

export default function LandingPage() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 sm:py-20 md:flex-row md:items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">{t('landing_title')}</h1>
          <p className="mt-4 max-w-xl text-neutral-400">{t('landing_sub')}</p>
          <div className="mt-6 flex gap-3">
            <Link href="/auth/login" className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200">{t('landing_login')}</Link>
            <Link href="/auth/signup" className="rounded border border-neutral-700 px-4 py-2 hover:bg-neutral-800">{t('landing_signup')}</Link>
          </div>
        </div>
        <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <p className="text-sm text-neutral-300">Demo preview</p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-400">
            <li>• Batch rating up to 5 jobs</li>
            <li>• Tailored CV & Cover Letter generation</li>
            <li>• Application tracker & history</li>
            <li>• Preferences & theme settings</li>
          </ul>
        </div>
      </section>

      {/* Marketing */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard title={t('feat_rate')} desc={t('feat_rate_desc')} />
          <FeatureCard title={t('feat_generate')} desc={t('feat_generate_desc')} />
          <FeatureCard title={t('feat_learn')} desc={t('feat_learn_desc')} />
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm text-neutral-400">{desc}</p>
    </div>
  )
}
