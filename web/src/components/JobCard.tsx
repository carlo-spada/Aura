import type { Job } from '../lib/api'
import Link from 'next/link'

type Props = { job: Job; score?: number }

export function JobCard({ job, score }: Props) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-medium">
            <Link href={`/job/${job.id}`} className="hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="text-sm text-neutral-400">{job.company}</p>
        </div>
        {typeof score === 'number' && (
          <span className="text-xs rounded bg-neutral-800 px-2 py-1 text-neutral-300">{score.toFixed(3)}</span>
        )}
      </div>
      <div className="mt-2 text-xs text-neutral-400">
        <span>{job.location || 'N/A'}</span>
        <span className="mx-2">•</span>
        <span>{job.date_posted || 'Unknown'}</span>
      </div>
      <div className="mt-3 text-sm">
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="text-neutral-300 hover:underline"
        >
          External Link ↗
        </a>
      </div>
    </div>
  )
}
