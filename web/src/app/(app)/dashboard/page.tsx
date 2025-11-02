'use client'
import { useEffect, useState } from 'react'
import { api, apiAuth, type Job } from '../../../lib/api'
import { Skeleton } from '../../../components/Skeleton'
import { JobCard } from '../../../components/JobCard'
import { StarRating } from '../../../components/StarRating'
import { useBatch } from '../../../components/BatchContext'
import { useSession } from 'next-auth/react'
import { apiAuth } from '../../../lib/api'
import Link from 'next/link'

export default function DashboardPage() {
  const { jobs, setJobs, ratings, rate } = useBatch()
  const { data } = useSession()
  const [loading, setLoading] = useState(jobs.length === 0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (jobs.length > 0) return setLoading(false)
    const token = (data as any)?.token as string | undefined
    const load = async () => {
      try {
        if (token) {
          const b = await apiAuth.getCurrentBatch(token)
          setJobs(b.jobs)
        } else {
          const d = await api.jobs()
          setJobs(d)
        }
      } catch (e: any) {
        // fallback to recent jobs if no batch
        try {
          const d = await api.jobs()
          setJobs(d)
        } catch (err) {
          setError(e?.message || String(e))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [jobs.length, setJobs, data])

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Dashboard</h2>
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
          {jobs.map((j) => (
            <div key={j.id} className="space-y-3">
              <JobCard job={j} />
              <div className="flex items-center justify-between">
                <StarRating
                  value={ratings[j.id] || 0}
                  onChange={async (v) => {
                    rate(j.id, v)
                    try {
                      const token = (data as any)?.token as string | undefined
                      if (token) await apiAuth.postRatingStars(j.id, v, token)
                    } catch (e) {
                      // Ignore for now; UI remains optimistic
                    }
                  }}
                />
                <span className="text-xs text-neutral-500">{ratings[j.id] ? `${ratings[j.id]}★` : 'Not rated'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Footer progress */}
      {!loading && jobs.length > 0 && (
        <div className="sticky bottom-20 mt-6 rounded border border-neutral-800 bg-neutral-900/60 p-3 backdrop-blur lg:bottom-auto">
          <BatchProgress total={jobs.length} rated={Object.keys(ratings).filter((k) => ratings[Number(k)] > 0).length} />
          {Object.values(ratings).filter((v) => v > 0).length === jobs.length && (
            <div className="mt-3 text-right">
              <Link href="/review" className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200">Review ≥4★</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BatchProgress({ total, rated }: { total: number; rated: number }) {
  const pct = Math.round((rated / Math.max(total, 1)) * 100)
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <span>
          Rated {rated}/{total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-neutral-800">
        <div className="h-full bg-neutral-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
