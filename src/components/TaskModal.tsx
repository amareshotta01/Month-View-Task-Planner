import { useEffect, useRef, useState } from "react"
import type { Category, Task } from "./types"
import { CATEGORY_LABELS } from "./types"
import { parseISO, isAfter, format } from "date-fns"

type Props = {
  open: boolean
  onClose: () => void
  initial?: Partial<Pick<Task, "title" | "category">>
  range: { startISO: string; endISO: string } | null
  onSubmit: (data: { title: string; category: Category; startISO?: string; endISO?: string }) => void
  mode?: "create" | "edit"
  onDelete?: () => void
}

export default function TaskModal({
  open,
  onClose,
  initial,
  range,
  onSubmit,
  mode = "create",
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [category, setCategory] = useState<Category>(initial?.category ?? "todo")
  const [startISO, setStartISO] = useState<string>("")
  const [endISO, setEndISO] = useState<string>("")
  const [dateError, setDateError] = useState<string>("")

  const initialTitle = initial?.title ?? ""
  const initialCategory = (initial?.category ?? "todo") as Category
  const initialStartISO = range?.startISO ?? ""
  const initialEndISO = range?.endISO ?? ""

  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const disableSubmit = !title.trim() || !!dateError
  const hasTitleChanged = title.trim() !== initialTitle
  const hasCategoryChanged = category !== initialCategory
  const bothDatesProvided = !!startISO && !!endISO
  const datesDiffer = bothDatesProvided && (startISO !== initialStartISO || endISO !== initialEndISO)
  const isDirty = hasTitleChanged || hasCategoryChanged || datesDiffer
  const disableSave = mode === "edit" ? disableSubmit || !isDirty : disableSubmit

  const rangePreview =
    (startISO || endISO) && !dateError
      ? `${startISO || "—"} → ${endISO || "—"}`
      : range
        ? `${range.startISO} → ${range.endISO}`
        : ""

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "")
      setCategory(initial?.category ?? "todo")
      if (range) {
        setStartISO(range.startISO)
        setEndISO(range.endISO)
      } else {
        setStartISO("")
        setEndISO("")
      }
      setDateError("")
      setTimeout(() => inputRef.current?.focus(), 50)
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open, initial, range])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Enter" && !disableSave) {
        if (!title.trim() || dateError) return
        const payload: { title: string; category: Category; startISO?: string; endISO?: string } = {
          title: title.trim(),
          category,
        }
        if (startISO && endISO) {
          payload.startISO = startISO
          payload.endISO = endISO
        }
        onSubmit(payload)
      }
    }
    if (open) window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose, title, category, startISO, endISO, dateError, disableSave])

  useEffect(() => {
    if (startISO && endISO) {
      try {
        const s = parseISO(startISO)
        const e = parseISO(endISO)
        if (isAfter(s, e)) {
          setDateError("Start date must be on or before end date.")
        } else {
          setDateError("")
        }
      } catch {
        setDateError("Invalid date.")
      }
    } else {
      setDateError("")
    }
  }, [startISO, endISO])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div ref={overlayRef} className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[1px]" />

      <div className="relative z-50 w-[95vw] max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">
          {mode === "create" ? "Create Task" : "Update Task"}
        </h2>
        {rangePreview && (
          <p className="mt-1 text-sm text-gray-500">
            {mode === "create" ? "Selected range: " : "Task range: "}
            {rangePreview}
          </p>
        )}
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Task Name</label>
            <input
              ref={inputRef}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              placeholder="e.g. Prepare report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="todo">{CATEGORY_LABELS["todo"]}</option>
              <option value="in-progress">{CATEGORY_LABELS["in-progress"]}</option>
              <option value="review">{CATEGORY_LABELS["review"]}</option>
              <option value="completed">{CATEGORY_LABELS["completed"]}</option>
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium">Dates (Optional)</label>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => {
                  if (range) {
                    setStartISO(range.startISO)
                    setEndISO(range.endISO)
                  } else {
                    const today = format(new Date(), "yyyy-MM-dd")
                    setStartISO(today)
                    setEndISO(today)
                  }
                }}
                title="Fill with current range"
              >
                Use current range
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label htmlFor="start-date" className="mb-1 block text-xs text-gray-600">
                  Start date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startISO}
                  onChange={(e) => setStartISO(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="mb-1 block text-xs text-gray-600">
                  End date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endISO}
                  onChange={(e) => setEndISO(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Leave empty to keep the existing range. If both are provided, they will override the range.
            </p>
            {dateError && <p className="mt-1 text-xs text-red-600">{dateError}</p>}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {mode === "edit" && onDelete && (
            <button
              className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => onDelete()}
              title="Delete this task"
            >
              Delete
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
              disabled={disableSave}
              onClick={() => {
                if (!title.trim() || dateError) return
                const payload: { title: string; category: Category; startISO?: string; endISO?: string } = {
                  title: title.trim(),
                  category,
                }
                if (startISO && endISO) {
                  payload.startISO = startISO
                  payload.endISO = endISO
                }
                onSubmit(payload)
              }}
            >
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}