'use client'
import Link from 'next/link'
import { useBatch } from '../../../components/BatchContext'

export default function ReviewPage() {
  const { jobs, ratings, selected, setSelected } = useBatch()
  const eligible = jobs.filter((j) => (ratings[j.id] || 0) >= 4)
  const toggle = (id: number) =>
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">You rated these jobs ≥4★</h2>
      {eligible.length === 0 ? (
        <p className="text-neutral-400">No jobs meet the threshold. You can adjust preferences in Settings or run a new search.</p>
      ) : (
        <div className="space-y-3">
          {eligible.map((j) => (
            <label key={j.id} className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900/50 p-3">
              <div>
                <div className="font-medium">{j.title}</div>
                <div className="text-sm text-neutral-400">{j.company} • {j.location || 'N/A'}</div>
              </div>
              <input type="checkbox" checked={selected.includes(j.id)} onChange={() => toggle(j.id)} />
            </label>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Link href="/dashboard" className="rounded border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Back</Link>
        <Link href="/applications" className="rounded bg-neutral-100 px-4 py-2 text-neutral-900 hover:bg-white dark:bg-neutral-200 disabled:opacity-50" aria-disabled={selected.length === 0}>
          Prepare applications
        </Link>
      </div>
    </div>
  )
}

