import Link from 'next/link'
import { Stepper } from '../Stepper'

export default function Step7() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Stepper step={7} />
      <h2 className="text-xl font-semibold">Jobs per batch</h2>
      <input type="range" min={1} max={5} defaultValue={5} className="mt-6 w-full" />
      <div className="mt-6 flex justify-between">
        <Link href="/onboarding/step-6" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link href="/onboarding/step-8" className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200">Next</Link>
      </div>
    </div>
  )
}

