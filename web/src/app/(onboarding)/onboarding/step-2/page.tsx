"use client"
import Link from 'next/link'
import { Stepper } from '../Stepper'
import { usePreferences } from '../../../../components/PreferencesContext'

const options = ['Student', 'Junior', 'Mid-level', 'Senior', 'Lead']

export default function Step2() {
  const { prefs, setPrefs, save } = usePreferences()
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={2} />
      <h2 className="text-xl font-semibold">Current experience level</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((x) => (
          <button
            key={x}
            onClick={() => setPrefs({ experience: x })}
            className={`rounded border px-3 py-2 text-left hover:border-neutral-700 ${
              prefs.experience === x ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-800 bg-neutral-900'
            }`}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-1" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link
          href="/onboarding/step-3"
          onClick={async (e) => {
            e.preventDefault()
            await save()
            window.location.href = '/onboarding/step-3'
          }}
          className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200"
        >
          Next
        </Link>
      </div>
    </div>
  )
}
