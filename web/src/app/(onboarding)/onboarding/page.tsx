import Link from 'next/link'

export default function OnboardingIndex() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h2 className="text-2xl font-semibold">Welcome to AURA</h2>
      <p className="mt-2 text-neutral-500">We’ll ask a few quick questions to tailor your experience.</p>
      <div className="mt-6">
        <Link className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200" href="/onboarding/step-1">Start</Link>
      </div>
    </div>
  )
}

