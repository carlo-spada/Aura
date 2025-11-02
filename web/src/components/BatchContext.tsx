"use client"
import { createContext, useContext, useMemo, useState } from 'react'
import type { Job } from '../lib/api'

type Ctx = {
  jobs: Job[]
  setJobs: (jobs: Job[]) => void
  ratings: Record<number, number>
  rate: (jobId: number, stars: number) => void
  selected: number[]
  setSelected: (ids: number[]) => void
}

const BatchCtx = createContext<Ctx | null>(null)

export function BatchProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [selected, setSelected] = useState<number[]>([])

  const value = useMemo<Ctx>(
    () => ({
      jobs,
      setJobs,
      ratings,
      rate: (jobId, stars) => setRatings((r) => ({ ...r, [jobId]: stars })),
      selected,
      setSelected,
    }),
    [jobs, ratings, selected]
  )
  return <BatchCtx.Provider value={value}>{children}</BatchCtx.Provider>
}

export function useBatch() {
  const ctx = useContext(BatchCtx)
  if (!ctx) throw new Error('useBatch must be used within BatchProvider')
  return ctx
}

