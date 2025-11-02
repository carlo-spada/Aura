'use client'

import { useEffect, useState } from 'react'
import { api, type ScoredJob } from '../../lib/api'
import { Skeleton } from '../../components/Skeleton'
import { JobCard } from '../../components/JobCard'

export default function SearchPage() {
  const [q, setQ] = useState('data scientist remote')
  const [results, setResults] = useState<ScoredJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.rank(q, 50, 10)
      setResults(data)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container">
      <h2 className="mb-3 text-lg font-semibold">Search</h2>
      <div className="mb-4 flex gap-2">
        <input
          className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          placeholder="e.g., data scientist remote NLP"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={run}
          className="rounded bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
        >
          Search
        </button>
      </div>
      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {results.map((j) => (
            <JobCard key={j.id} job={j} score={j.score} />
          ))}
        </div>
      )}
    </div>
  )
}
