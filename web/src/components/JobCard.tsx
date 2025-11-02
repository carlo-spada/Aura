import type { Job } from '../lib/api'
import Link from 'next/link'
import { useMemo } from 'react'

type Props = { job: Job; score?: number }

export function JobCard({ job, score }: Props) {
  const tags = useMemo(() => {
    const t: string[] = []
    const title = (job.title || '').toLowerCase()
    const loc = (job.location || '').toLowerCase()
    if (loc.includes('remote')) t.push('Remote')
    const skills = ['python', 'sql', 'nlp', 'ml', 'ai', 'llm', 'react', 'node', 'go', 'rust', 'aws', 'gcp', 'azure', 'docker', 'kubernetes']
    const found = skills.filter((s) => title.includes(s)).slice(0, 3)
    t.push(...found.map((s) => s.toUpperCase()))
    return t
  }, [job.title, job.location])
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
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tg) => (
            <span key={tg} className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
              {tg}
            </span>
          ))}
        </div>
      )}
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
