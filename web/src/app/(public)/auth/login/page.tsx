"use client"
import { signIn, useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function LoginPage() {
  const { data } = useSession()
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h2 className="text-2xl font-semibold">Welcome back</h2>
      {data?.user ? (
        <div className="mt-4 space-y-3">
          <p className="text-neutral-400">Signed in as {data.user.email || data.user.name}</p>
          <div className="flex gap-3">
            <Link href="/dashboard" className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200">Go to Dashboard</Link>
            <button onClick={() => signOut()} className="rounded border border-neutral-700 px-4 py-2 hover:bg-neutral-900">Sign out</button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <button onClick={() => signIn('github')} className="w-full rounded border border-neutral-700 px-4 py-2 hover:bg-neutral-900">Continue with GitHub</button>
          <button onClick={() => signIn('google')} className="w-full rounded border border-neutral-700 px-4 py-2 hover:bg-neutral-900">Continue with Google</button>
        </div>
      )}
    </div>
  )
}

