export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function get<T>(path: string): Promise<T> {
  // Client-side fetch; avoid Next.js server-only options
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  health: () => get<{ status: string; db: boolean; index: boolean }>(`/healthz`),
  jobs: (q?: string) => get(`/jobs${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  search: (q: string, k = 10) => get(`/search?q=${encodeURIComponent(q)}&k=${k}`),
  rank: (q: string, k = 50, top = 10) => get(`/rank?q=${encodeURIComponent(q)}&k=${k}&top=${top}`),
}
