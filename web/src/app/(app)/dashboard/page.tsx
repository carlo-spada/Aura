'use client'
import { useEffect, useState } from 'react'
import { api, type Job } from '../../../lib/api'
import { Skeleton } from '../../../components/Skeleton'
import { JobCard } from '../../../components/JobCard'

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.jobs()
      .then((data) => setJobs(data))
      .catch((e) => setError(e?.message || String(e)))
      .finally(() => setLoading(false))
  }, [])

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
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  )
}

