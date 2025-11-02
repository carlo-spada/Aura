'use client'

import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { JobCard } from '../components/JobCard'

export default function HomePage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .jobs()
      .then((data) => setJobs(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container">
      <h2 className="mb-3 text-lg font-semibold">Recent Jobs</h2>
      {loading && <p className="opacity-70">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>
    </div>
  )
}

