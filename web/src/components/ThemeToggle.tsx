"use client"
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="rounded border border-neutral-300/20 bg-neutral-100/0 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-100/10 dark:border-neutral-700 dark:text-neutral-200"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}

