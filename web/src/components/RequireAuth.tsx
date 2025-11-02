"use client"
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  if (status === 'loading') return <div className="p-6 text-sm text-neutral-400">Loading…</div>
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-semibold">Sign in required</h2>
        <p className="mt-2 text-neutral-400">Please sign in to continue onboarding.</p>
        <div className="mt-6">
          <Link href="/api/auth/signin" className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200">Sign in</Link>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

