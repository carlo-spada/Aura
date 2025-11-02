"use client"
import Link from 'next/link'

export function Stepper({ step, total = 8 }: { step: number; total?: number }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="text-sm text-neutral-400">Step {step} of {total}</div>
      <Link href="/" className="text-sm text-neutral-400 hover:underline">Exit</Link>
    </div>
  )
}

