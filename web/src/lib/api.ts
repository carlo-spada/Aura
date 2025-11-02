export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type Job = {
  id: number
  title: string
  company: string
  location?: string | null
  date_posted?: string | null
  url: string
}

export type ScoredJob = Job & { score: number }

async function get<T>(path: string): Promise<T> {
  // Client-side fetch; avoid Next.js server-only options
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  health: (): Promise<{ status: string; db: boolean; index: boolean }> => get(`/healthz`),
  jobs: (q?: string): Promise<Job[]> =>
    get(`/jobs${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  job: (id: number): Promise<Job> => get(`/jobs/${id}`),
  search: (q: string, k = 10): Promise<ScoredJob[]> =>
    get(`/search?q=${encodeURIComponent(q)}&k=${k}`),
  rank: (q: string, k = 50, top = 10): Promise<ScoredJob[]> =>
    get(`/rank?q=${encodeURIComponent(q)}&k=${k}&top=${top}`),
}
