"use client"
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light'
type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }

const ThemeCtx = createContext<Ctx | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('theme')) as Theme | null
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const t: Theme = saved || (prefersDark ? 'dark' : 'light')
    setTheme(t)
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (theme === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  const value = useMemo<Ctx>(() => ({ theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'), setTheme }), [theme])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

