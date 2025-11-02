"use client"
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { locales, type Locale } from '../i18n/locales'

type Ctx = { lang: Locale; setLang: (l: Locale) => void; t: (key: string) => string }
const I18nCtx = createContext<Ctx | null>(null)

const SUPPORTED: Locale[] = ['en', 'es', 'de', 'fr', 'it']

function detect(): Locale {
  if (typeof navigator !== 'undefined') {
    const cand = navigator.language.split('-')[0] as Locale
    if (SUPPORTED.includes(cand)) return cand
  }
  return 'en'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>('en')
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('lang')) as Locale | null
    setLangState(saved || detect())
  }, [])
  const setLang = (l: Locale) => {
    setLangState(l)
    if (typeof window !== 'undefined') localStorage.setItem('lang', l)
  }
  const t = (key: string) => locales[lang][key] ?? locales.en[key] ?? key
  const value = useMemo<Ctx>(() => ({ lang, setLang, t }), [lang])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nCtx)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

