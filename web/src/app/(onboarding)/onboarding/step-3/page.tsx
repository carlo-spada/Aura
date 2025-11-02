"use client"
import Link from 'next/link'
import { Stepper } from '../Stepper'
import { usePreferences } from '../../../../components/PreferencesContext'

export default function Step3() {
  const { prefs, setPrefs, save } = usePreferences()
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={3} />
      <h2 className="text-xl font-semibold">Location preferences</h2>
      <div className="mt-4 space-y-3">
        {['remote','hybrid','on-site'].map((mode) => (
          <label key={mode} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="location_mode"
              checked={prefs.location_mode === mode}
              onChange={() => setPrefs({ location_mode: mode })}
            />
            {mode.charAt(0).toUpperCase()+mode.slice(1)}
          </label>
        ))}
        <input
          className="mt-2 w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 outline-none"
          placeholder="City (optional)"
          value={prefs.location_text || ''}
          onChange={(e) => setPrefs({ location_text: e.target.value })}
        />
      </div>
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-2" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link
          href="/onboarding/step-4"
          onClick={async (e) => {
            e.preventDefault()
            await save()
            window.location.href = '/onboarding/step-4'
          }}
          className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200"
        >
          Next
        </Link>
      </div>
    </div>
  )
}
