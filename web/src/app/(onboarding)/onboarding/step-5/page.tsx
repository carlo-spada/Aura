"use client"
import Link from 'next/link'
import { Stepper } from '../Stepper'
import { usePreferences } from '../../../../components/PreferencesContext'

export default function Step5() {
  const { prefs, setPrefs, save } = usePreferences()
  const companies = ['Startup', 'Corporation', 'Non-profit', 'Agency', 'Academia']
  const toggle = (x: string) => {
    const current = new Set(prefs.company_types || [])
    if (current.has(x)) current.delete(x)
    else current.add(x)
    setPrefs({ company_types: Array.from(current) })
  }
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={5} />
      <h2 className="text-xl font-semibold">Preferred company types</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {companies.map((x) => (
          <button
            key={x}
            onClick={() => toggle(x)}
            className={`rounded border px-3 py-2 text-left hover:border-neutral-700 ${
              (prefs.company_types || []).includes(x) ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-800 bg-neutral-900'
            }`}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-4" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link
          href="/onboarding/step-6"
          onClick={async (e) => {
            e.preventDefault()
            await save()
            window.location.href = '/onboarding/step-6'
          }}
          className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200"
        >
          Next
        </Link>
      </div>
    </div>
  )
}
