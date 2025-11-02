'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, type Job } from '../../../lib/api'
import { Skeleton } from '../../../components/Skeleton'

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = Number(params.id)
    if (!id) return
    api
      .job(id)
      .then((j) => setJob(j))
      .catch((e) => setError(e?.message || String(e)))
      .finally(() => setLoading(false))
  }, [params.id])

  return (
    <div className="container">
      <button
        onClick={() => router.back()}
        className="mb-4 rounded border border-neutral-800 px-3 py-1 text-sm hover:border-neutral-600"
      >
        ← Back
      </button>
      {loading && (
        <div>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      )}
      {error && <p className="text-red-400">{error}</p>}
      {job && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="text-lg font-semibold">{job.title}</h2>
          <p className="text-neutral-400">{job.company}</p>
          <div className="mt-2 text-sm text-neutral-300">
            <span>{job.location || 'N/A'}</span>
            <span className="mx-2">•</span>
            <span>{job.date_posted || 'Unknown'}</span>
          </div>
          <div className="mt-4">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
            >
              View Job Posting ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

