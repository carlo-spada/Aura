"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiAuth, type Preferences } from '../lib/api'

type Ctx = {
  prefs: Preferences
  setPrefs: (p: Partial<Preferences>) => void
  save: () => Promise<void>
  loaded: boolean
  saving: boolean
  error: string | null
}

const defaultPrefs: Preferences = {
  roles: [],
  experience: undefined,
  location_mode: undefined,
  location_text: undefined,
  include_skills: [],
  exclude_skills: [],
  company_types: [],
  batch_size: 5,
  frequency_days: 7,
  cv_url: undefined,
}

const PrefsCtx = createContext<Ctx | null>(null)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSession()
  const token = (data as any)?.token as string | undefined
  const [prefs, setPrefsState] = useState<Preferences>(defaultPrefs)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!token) {
        setLoaded(true)
        return
      }
      try {
        const p = await apiAuth.getPreferences(token)
        if (!cancelled) {
          setPrefsState((prev) => ({ ...prev, ...p }))
          setLoaded(true)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || String(e))
          setLoaded(true)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  const setPrefs = useCallback((p: Partial<Preferences>) => {
    setPrefsState((prev) => ({ ...prev, ...p }))
  }, [])

  const save = useCallback(async () => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const payload: Preferences = { ...prefs }
      // Normalize empty arrays/strings
      if (payload.roles && payload.roles.length === 0) delete (payload as any).roles
      if (payload.include_skills && payload.include_skills.length === 0) delete (payload as any).include_skills
      if (payload.exclude_skills && payload.exclude_skills.length === 0) delete (payload as any).exclude_skills
      if (payload.company_types && payload.company_types.length === 0) delete (payload as any).company_types
      await apiAuth.putPreferences(payload, token)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setSaving(false)
    }
  }, [prefs, token])

  const value = useMemo<Ctx>(() => ({ prefs, setPrefs, save, loaded, saving, error }), [prefs, setPrefs, save, loaded, saving, error])
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>
}

export function usePreferences() {
  const ctx = useContext(PrefsCtx)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}

