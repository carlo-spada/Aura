"use client"
import Link from 'next/link'
import { Stepper } from '../Stepper'
import { usePreferences } from '../../../../components/PreferencesContext'

export default function Step6() {
  const { save } = usePreferences()
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={6} />
      <h2 className="text-xl font-semibold">Upload your CV (or create a generic one)</h2>
      <div className="mt-4 rounded border border-neutral-800 bg-neutral-900 p-6 text-sm">
        <p className="text-neutral-400">Drag & drop file here (placeholder)</p>
        <div className="mt-4 flex gap-3">
          <button className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200">Upload</button>
          <button className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Create generic CV</button>
        </div>
      </div>
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-5" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link
          href="/onboarding/step-7"
          onClick={async (e) => {
            e.preventDefault()
            await save()
            window.location.href = '/onboarding/step-7'
          }}
          className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200"
        >
          Next
        </Link>
      </div>
    </div>
  )
}
