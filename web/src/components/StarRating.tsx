"use client"
import { useState } from 'react'

type Props = {
  value: number
  onChange: (v: number) => void
}

export function StarRating({ value, onChange }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rate 1 to 5 stars">
      {stars.map((s) => {
        const active = (hover ?? value) >= s
        return (
          <button
            key={s}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(s)}
            role="radio"
            aria-checked={value === s}
            className={`h-6 w-6 rounded-sm ${active ? 'text-yellow-400' : 'text-neutral-600'} hover:text-yellow-300`}
            title={`${s} star${s > 1 ? 's' : ''}`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

