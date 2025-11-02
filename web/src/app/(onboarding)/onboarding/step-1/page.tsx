"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Stepper } from '../Stepper'
import { usePreferences } from '../../../../components/PreferencesContext'

export default function Step1() {
  const [roles, setRoles] = useState('')
  const { prefs, setPrefs, save } = usePreferences()
  // preload from prefs
  useEffect(() => {
    if (prefs?.roles?.length) setRoles(prefs.roles.join(', '))
  }, [prefs?.roles])
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={1} />
      <h2 className="text-xl font-semibold">What role(s) are you looking for?</h2>
      <p className="mt-2 text-sm text-neutral-500">Pick from suggestions or type your own.</p>
      <input value={roles} onChange={(e) => setRoles(e.target.value)} className="mt-4 w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 outline-none" placeholder="e.g., Data Scientist, ML Engineer" />
      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/onboarding/step-2"
          onClick={async (e) => {
            e.preventDefault()
            const arr = roles
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
            setPrefs({ roles: arr })
            await save()
            window.location.href = '/onboarding/step-2'
          }}
          className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200"
        >
          Next
        </Link>
      </div>
    </div>
  )
}
