"use client"
import { useI18n } from './I18nProvider'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

const options = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'it', label: 'IT' },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n() as any
  const [open, setOpen] = useState(false)
  const current = useMemo(() => options.find((o) => o.code === lang)?.label || 'EN', [lang])
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded border border-neutral-300/20 bg-neutral-100/0 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-100/10 dark:border-neutral-700 dark:text-neutral-200"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-28 rounded border border-neutral-800 bg-neutral-900 p-1">
          {options.map((o) => (
            <button
              key={o.code}
              onClick={() => {
                setLang(o.code)
                setOpen(false)
              }}
              className={clsx(
                'block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-800',
                o.code === lang && 'bg-neutral-800'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

