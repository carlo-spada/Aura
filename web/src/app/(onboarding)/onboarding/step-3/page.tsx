import Link from 'next/link'
import { Stepper } from '../Stepper'

export default function Step3() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={3} />
      <h2 className="text-xl font-semibold">Location preferences</h2>
      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Remote</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Hybrid</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> On-site</label>
        <input className="mt-2 w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 outline-none" placeholder="City (optional)" />
      </div>
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-2" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link href="/onboarding/step-4" className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200">Next</Link>
      </div>
    </div>
  )
}

