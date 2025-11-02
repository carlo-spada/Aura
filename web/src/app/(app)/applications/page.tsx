"use client"
import { useBatch } from '../../../components/BatchContext'

export default function ApplicationsPage() {
  const { jobs, selected } = useBatch()
  const chosen = jobs.filter((j) => selected.includes(j.id))
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Application Packages</h2>
      {chosen.length === 0 ? (
        <p className="text-neutral-400">Select jobs in the Review step to prepare applications.</p>
      ) : (
        <div className="space-y-4">
          {chosen.map((j) => (
            <div key={j.id} className="rounded border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="font-medium">{j.title} — {j.company}</div>
              <p className="mt-1 text-sm text-neutral-400">Placeholder preview for tailored CV/CL. Generation will be wired later.</p>
              <div className="mt-3 flex gap-2">
                <button className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800">Edit CV</button>
                <button className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800">Edit Cover Letter</button>
                <button className="rounded bg-neutral-100 px-3 py-1 text-sm text-neutral-900 hover:bg-white dark:bg-neutral-200">Download PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
