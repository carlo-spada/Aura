'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, type ScoredJob } from '../../lib/api'
import { Skeleton } from '../../components/Skeleton'
import { JobCard } from '../../components/JobCard'
import { useDebounce } from '../../lib/useDebounce'

export default function SearchPage() {
  const params = useSearchParams()
  const router = useRouter()
  const initialQ = params.get('q') || 'data scientist remote'
  const [q, setQ] = useState(initialQ)
  const qDebounced = useDebounce(q, 500)
  const [results, setResults] = useState<ScoredJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [took, setTook] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const canSearch = useMemo(() => q.trim().length >= 2, [q])

  const run = async (manual = false) => {
    if (!canSearch) {
      setResults([])
      return
    }
    // Sync URL on manual search or when debounced changes
    const url = q ? `/search?q=${encodeURIComponent(q)}` : '/search'
    router.replace(url)

    // cancel previous
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)
    const t0 = performance.now()
    try {
      const data = await api.rank(q, 50, 10, { signal: ctrl.signal })
      setResults(data)
      setTook(Math.round(performance.now() - t0))
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || String(e))
      setResults([])
      setTook(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // auto-run on initial mount and when debounced query changes
    run(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced])

  return (
    <div className="container">
      <h2 className="mb-3 text-lg font-semibold">Search</h2>
      <div className="mb-4 flex gap-2">
        <input
          className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          placeholder="e.g., data scientist remote NLP"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run(true)
          }}
          aria-busy={loading}
        />
        <button
          onClick={() => run(true)}
          disabled={!canSearch || loading}
          className="rounded bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Search
        </button>
        {q && (
          <button
            onClick={() => setQ('')}
            className="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:border-neutral-600"
          >
            Clear
          </button>
        )}
      </div>
      {took !== null && !loading && (
        <p className="mb-3 text-xs text-neutral-400">{results.length} results in {took} ms</p>
      )}
      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>
      )}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {results.map((j) => (
            <JobCard key={j.id} job={j} score={j.score} />
          ))}
        </div>
      )}
      {!loading && !error && results.length === 0 && canSearch && (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-300">
          <p>No results. Try broadening your query or removing niche terms.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['data scientist remote', 'full stack developer', 'ml engineer nlp', 'react frontend remote'].map((s) => (
              <button key={s} onClick={() => setQ(s)} className="rounded border border-neutral-700 px-2 py-1 text-xs hover:border-neutral-600">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
