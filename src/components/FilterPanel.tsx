"use client"

import type React from 'react';
import type { Category, Filters, TimeWindow } from './types';
import { CATEGORY_DOT, CATEGORY_LABELS, CATEGORY_ACCENT} from "./types"
import { X } from 'lucide-react'
import { useCallback } from 'react';

type Props = {
  filters: Filters
  onToggleCategory: (cat: Category) => void
  onTimeWindowChange: (tw: TimeWindow) => void
  onSearchChange: (value: string) => void
  onClearFilters: () => void
  persist: boolean
  onTogglePersist: () => void
}

const TIME_WINDOWS: { label: string; value: TimeWindow }[] = [
  { label: "All time", value: null },
  { label: "Within 1 week", value: 7 },
  { label: "Within 2 weeks", value: 14 },
  { label: "Within 3 weeks", value: 21 },
]

export default function FilterPanel({
  filters,
  onToggleCategory,
  onTimeWindowChange,
  onSearchChange,
  onClearFilters,
  persist,
  onTogglePersist,
}: Props) {

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        onTimeWindowChange(TIME_WINDOWS[idx].value)
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault()
        const next = (idx + 1) % TIME_WINDOWS.length
        onTimeWindowChange(TIME_WINDOWS[next].value)
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault()
        const prev = (idx - 1 + TIME_WINDOWS.length) % TIME_WINDOWS.length
        onTimeWindowChange(TIME_WINDOWS[prev].value)
      }
    },
    [onTimeWindowChange],
  )

  return (
    <aside className="w-full max-w-xs shrink-0 border-r bg-white p-4 md:w-72">
      <h2 className="text-base font-semibold">Filters</h2>

      <section className="mt-4">
        <label htmlFor="task-search" className="text-sm font-medium">
          Search by name
        </label>
        <div className="mt-2 relative">
          <input
            id="task-search"
            type="text"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Type to filter tasks..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-9 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-medium">Categories</h3>
        <div className="mt-2 space-y-2">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => {
            const checked = filters.categories.has(cat)
            return (
              <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-none outline-none"
                  checked={checked}
                  onChange={() => onToggleCategory(cat)}
                  style={{ accentColor: CATEGORY_ACCENT[cat] }}
                  aria-label={CATEGORY_LABELS[cat]}
                />
                <span className={`h-2 w-2 rounded-full ${CATEGORY_DOT[cat]}`} />
                <span>{CATEGORY_LABELS[cat]}</span>
              </label>
            )
          })}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-medium">Time</h3>
        <div  role="radiogroup" aria-label="Time window" className="mt-2 space-y-2">
          {TIME_WINDOWS.map((t, idx) => {
            const checked = filters.timeWindow === t.value
            const circleClasses = checked
              ? "bg-emerald-600 border-transparent"
              : "bg-white border-gray-400"

            return (
              <button
                key={String(t.value)}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-current={checked || undefined}
                onClick={() => onTimeWindowChange(t.value)}
                onKeyDown={(e) => handleKey(e, idx)}
                className={`flex w-full items-center gap-2 rounded-md px-1 py-1 text-left outline-none transition-colors`}
              >
                <span className={`inline-block h-5 w-5 rounded-full border transition-colors ${circleClasses}`} />
                <span className="select-none text-sm">{t.label}</span>

                <input type="radio" name="timewindow" className="sr-only" tabIndex={-1} checked={checked} readOnly />
              </button>
            )
          })}
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={persist} onChange={onTogglePersist} />
          <span>Persist tasks (localStorage)</span>
        </label>
      </div>

      <button
        className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        onClick={onClearFilters}
      >
        Clear filters
      </button>

      <p className="mt-6 text-xs text-gray-500">
        Tip: Drag across days to create a task. Drag a task to move. Use the side handles to resize.
      </p>
    </aside>
  )
}