import Link from 'next/link'
import { Stepper } from '../Stepper'

export default function Step8() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={8} />
      <h2 className="text-xl font-semibold">Search frequency</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {['Daily', 'Weekly', 'Bi-weekly', 'Monthly'].map((x) => (
          <button key={x} className="rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-left hover:border-neutral-700">{x}</button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-7" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link href="/onboarding/processing" className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200">Finish</Link>
      </div>
    </div>
  )
}

