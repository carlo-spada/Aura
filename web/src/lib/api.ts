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

export type Preferences = {
  roles?: string[]
  experience?: string
  location_mode?: string
  location_text?: string
  include_skills?: string[]
  exclude_skills?: string[]
  company_types?: string[]
  batch_size?: number
  frequency_days?: number
  cv_url?: string
}

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

export const apiAuth = {
  postRatingStars: async (job_id: number, stars: number, token: string): Promise<{ ok: boolean }> => {
    const res = await fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ job_id, stars }),
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  },
  putPreferences: async (prefs: Preferences, token: string): Promise<Preferences> => {
    const res = await fetch(`${API_URL}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(prefs),
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  },
  getPreferences: async (token: string): Promise<Preferences> => {
    const res = await fetch(`${API_URL}/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  },
  createBatch: async (token: string): Promise<{ id: number; jobs: Job[] }> => {
    const res = await fetch(`${API_URL}/batches`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  },
  getCurrentBatch: async (token: string): Promise<{ id: number; jobs: Job[] }> => {
    const res = await fetch(`${API_URL}/batches/current`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  },
}
