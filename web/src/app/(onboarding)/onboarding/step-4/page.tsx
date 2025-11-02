"use client"
import Link from 'next/link'
import { Stepper } from '../Stepper'
import { usePreferences } from '../../../../components/PreferencesContext'

export default function Step4() {
  const { prefs, setPrefs, save } = usePreferences()
  const parse = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={4} />
      <h2 className="text-xl font-semibold">Skills to include or exclude</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-400">Include</label>
          <input
            className="mt-2 w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 outline-none"
            placeholder="e.g., Python, NLP"
            defaultValue={(prefs.include_skills || []).join(', ')}
            onBlur={(e) => setPrefs({ include_skills: parse(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm text-neutral-400">Exclude</label>
          <input
            className="mt-2 w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 outline-none"
            placeholder="e.g., PHP"
            defaultValue={(prefs.exclude_skills || []).join(', ')}
            onBlur={(e) => setPrefs({ exclude_skills: parse(e.target.value) })}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-3" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link
          href="/onboarding/step-5"
          onClick={async (e) => {
            e.preventDefault()
            await save()
            window.location.href = '/onboarding/step-5'
          }}
          className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200"
        >
          Next
        </Link>
      </div>
    </div>
  )
}
