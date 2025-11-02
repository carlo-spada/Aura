"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiAuth } from '../../../lib/api'

export default function ProcessingPage() {
  const { data } = useSession()
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const token = (data as any)?.token as string | undefined
        if (!token) return
        await apiAuth.createBatch(token)
        if (!cancelled) window.location.href = '/dashboard'
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e))
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [data])

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <h2 className="text-2xl font-semibold">We’re getting your first results</h2>
      <p className="mt-3 text-neutral-400">AURA is discovering and ranking jobs based on your preferences. You’ll be redirected when your batch is ready.</p>
      <div className="mx-auto mt-8 h-2 w-64 overflow-hidden rounded-full bg-neutral-800">
        <div className="h-full w-1/2 animate-pulse bg-neutral-600" />
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  )
}
