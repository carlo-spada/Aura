"use client"
import Link from 'next/link'
import { Stepper } from '../Stepper'
import { useSession } from 'next-auth/react'
import { apiAuth } from '../../../../lib/api'
import { useState } from 'react'

export default function Step8() {
  const { data } = useSession()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freq, setFreq] = useState<number>(7)
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={8} />
      <h2 className="text-xl font-semibold">Search frequency</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: 'Daily', days: 1 },
          { label: 'Weekly', days: 7 },
          { label: 'Bi-weekly', days: 14 },
          { label: 'Monthly', days: 30 },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => setFreq(opt.days)}
            className={`rounded border px-3 py-2 text-left hover:border-neutral-700 ${
              freq === opt.days ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-800 bg-neutral-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-7" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <button
          disabled={!data?.token || saving}
          onClick={async () => {
            if (!data?.token) return
            setSaving(true)
            setError(null)
            try {
              await apiAuth.putPreferences({ frequency_days: freq }, (data as any).token as string)
              window.location.href = '/onboarding/processing'
            } catch (e: any) {
              setError(e?.message || String(e))
            } finally {
              setSaving(false)
            }
          }}
          className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white disabled:opacity-50 dark:bg-neutral-200"
        >
          {saving ? 'Saving…' : 'Finish'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
