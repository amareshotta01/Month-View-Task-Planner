"use client"

import { useEffect, useState } from "react"
import Calendar from "./components/Calendar"
import FilterPanel from "./components/FilterPanel"
import TaskModal from "./components/TaskModal"
import type { Category, Filters, Task, TimeWindow } from "./components/types"
import { addDays, format, parseISO } from "date-fns"
import "./App.css"
import { useToast } from "./components/ToastProvider"

type DraftRange = { startISO: string; endISO: string } | null

const LS_TASKS_KEY = "mvtp:tasks"
const LS_PERSIST_KEY = "mvtp:persist"

export default function App() {
const now = new Date()
const [year, setYear] = useState(now.getFullYear())
const [month, setMonth] = useState(now.getMonth())

const [tasks, setTasks] = useState<Task[]>([])
const [persist, setPersist] = useState<boolean>(false)

// CHANGED: include search in Filters
const [filters, setFilters] = useState<Filters>({ categories: new Set(), timeWindow: null, search: "" })
const [createRange, setCreateRange] = useState<DraftRange>(null)
const [editTask, setEditTask] = useState<Task | null>(null)

const { toast } = useToast()

useEffect(() => {
  const persistFlag = localStorage.getItem(LS_PERSIST_KEY) === "true"
  setPersist(persistFlag)
  if (persistFlag) {
    const raw = localStorage.getItem(LS_TASKS_KEY)
    if (raw) {
      try {
        setTasks(JSON.parse(raw))
      } catch {}
    }
  } else {
    setTasks([])
  }
}, [])

useEffect(() => {
  if (persist) {
    localStorage.setItem(LS_TASKS_KEY, JSON.stringify(tasks))
  }
}, [persist, tasks])

function togglePersist() {
  const next = !persist
  setPersist(next)
  localStorage.setItem(LS_PERSIST_KEY, String(next))
}

function addTask(
    data: { title: string; category: Category; startISO?: string; endISO?: string },
    fallbackRange: { startISO: string; endISO: string } | null,
  ) {

    let startISO = data.startISO
    let endISO = data.endISO

    if (!(startISO && endISO)) {
      if (fallbackRange) {
        startISO = fallbackRange.startISO
        endISO = fallbackRange.endISO
      } else {
        const today = format(new Date(), "yyyy-MM-dd")
        startISO = today
        endISO = today
      }
    }

    const t: Task = {
      id: crypto.randomUUID(),
      title: data.title,
      category: data.category,
      start: startISO!,
      end: endISO!,
      createdAt: Date.now(),
    }
    setTasks((prev) => [...prev, t])
    toast({
      kind: "success",
      title: "Task created",
      message: `“${data.title}” (${data.category})`,
      category: data.category,
    })
  }



function updateTask(id: string, partial: Partial<Task>) {
  setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)))
}

function deleteTask(id: string) {
  const old = tasks.find((t) => t.id === id)
  setTasks((prev) => prev.filter((t) => t.id !== id))
  if (old) {
    toast({ kind: "error", title: "Task deleted", message: `“${old.title}” removed` })
  }
}

function moveTaskByDays(id: string, deltaDays: number) {
  if (deltaDays === 0) return
  const old = tasks.find((t) => t.id === id)
  setTasks((prev) =>
    prev.map((t) =>
      t.id === id
        ? {
            ...t,
            start: format(addDays(parseISO(t.start), deltaDays), "yyyy-MM-dd"),
            end: format(addDays(parseISO(t.end), deltaDays), "yyyy-MM-dd"),
          }
        : t,
    ),
  )
  if (old) {
    const dir = deltaDays > 0 ? "→" : "←"
    toast({
      kind: "info",
      title: "Task moved",
      message: `“${old.title}” ${dir} ${Math.abs(deltaDays)} day${Math.abs(deltaDays) === 1 ? "" : "s"}`,
      category: old.category,
    })
  }
}

function resizeTaskTo(id: string, edge: "start" | "end", newDateISO: string) {
  let changed = false
  setTasks((prev) =>
    prev.map((t) => {
      if (t.id !== id) return t
      if (edge === "start") {
        const newStart = parseISO(newDateISO)
        if (newStart > parseISO(t.end) || t.start === newDateISO) return t
        changed = true
        return { ...t, start: newDateISO }
      } else {
        const newEnd = parseISO(newDateISO)
        if (newEnd < parseISO(t.start) || t.end === newDateISO) return t
        changed = true
        return { ...t, end: newDateISO }
      }
    }),
  )
  if (changed) {
    const old = tasks.find((t) => t.id === id)
    if (old) {
      toast({
        kind: "info",
        title: "Task resized",
        message: `“${old.title}” ${edge === "start" ? "start" : "end"} → ${newDateISO}`,
        category: old.category,
      })
    }
  }
}

function onToggleCategory(cat: Category) {
  setFilters((f) => {
    const next = new Set(f.categories)
    if (next.has(cat)) next.delete(cat)
    else next.add(cat)
    return { ...f, categories: next }
  })
}

function onTimeWindowChange(tw: TimeWindow) {
  setFilters((f) => ({ ...f, timeWindow: tw }))
}

function onSearchChange(value: string) {
  setFilters((f) => ({ ...f, search: value }))
}

function onClearFilters() {
  setFilters({ categories: new Set(), timeWindow: null, search: "" })
  setPersist(false)
  localStorage.setItem(LS_PERSIST_KEY, "false")
}

function handleCreateSubmit(data: { title: string; category: Category; startISO?: string; endISO?: string }) {
  addTask(data, createRange)
  setCreateRange(null)
}

function handleEditSubmit(data: { title: string; category: Category; startISO?: string; endISO?: string }) {
  if (editTask) {
    const prevCategory = editTask.category
    const newCategory = data.category
    const categoryChanged = prevCategory !== newCategory

    const patch: Partial<Task> = { title: data.title, category: data.category }
      if (data.startISO && data.endISO) {
        patch.start = data.startISO
        patch.end = data.endISO
      }

      updateTask(editTask.id, patch)
    toast({
      kind: "success",
      title: "Task updated",
      message: categoryChanged ? `“${data.title}” moved to ${newCategory}` : `“${data.title}” saved`,
      category: categoryChanged ? newCategory : prevCategory, // use new category color if changed
    })
  }
  setEditTask(null)
}

function handleDeleteEditTask() {
  if (editTask) {
    const id = editTask.id
    deleteTask(id)
    setEditTask(null)
  }
}

function onMonthChange(delta: -1 | 1) {
  let m = month + delta
  let y = year
  if (m < 0) {
    m = 11
    y--
  } else if (m > 11) {
    m = 0
    y++
  }
  setMonth(m)
  setYear(y)
}

function goToToday() {
  const t = new Date()
  setYear(t.getFullYear())
  setMonth(t.getMonth())
}

return (
  <div className="flex h-dvh w-full flex-col bg-white">
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="text-xl font-bold">Month View Task Planner</div>
      <div className="text-sm text-gray-500">Drag to create • Drag task to move • Resize edges</div>
    </header>

    <div className="flex min-h-0 flex-1">
      <div className="hidden md:block">
        <FilterPanel
          filters={filters}
          onToggleCategory={onToggleCategory}
          onTimeWindowChange={onTimeWindowChange}
          onSearchChange={onSearchChange}
          onClearFilters={onClearFilters}
          persist={persist}
          onTogglePersist={togglePersist}
        />
      </div>

      <details className="md:hidden">
        <summary className="cursor-pointer border-b bg-gray-50 px-4 py-3 text-sm font-medium">Filters</summary>
        <FilterPanel
          filters={filters}
          onToggleCategory={onToggleCategory}
          onTimeWindowChange={onTimeWindowChange}
          onSearchChange={onSearchChange}
          onClearFilters={onClearFilters}
          persist={persist}
          onTogglePersist={togglePersist}
        />
      </details>

      <main className="min-h-0 flex-1 p-3">
        <div className="mx-auto h-full max-w-[1400px]">
          <Calendar
            year={year}
            month={month}
            tasks={tasks}
            filters={filters}
            onMoveDays={moveTaskByDays}
            onResizeTo={resizeTaskTo}
            onCreateRequest={(range) => setCreateRange(range)}
            onTaskClick={(t) => setEditTask(t)}
            onMonthChange={onMonthChange}
            onGoToday={goToToday}
          />
        </div>
      </main>
    </div>

    <TaskModal
      open={!!createRange}
      onClose={() => setCreateRange(null)}
      range={createRange}
      onSubmit={handleCreateSubmit}
      mode="create"
    />
    <TaskModal
      open={!!editTask}
      onClose={() => setEditTask(null)}
      initial={editTask ? { title: editTask.title, category: editTask.category } : undefined}
      range={editTask ? { startISO: editTask.start, endISO: editTask.end } : null}
      onSubmit={handleEditSubmit}
      mode="edit"
      onDelete={handleDeleteEditTask}
    />
  </div>
)
}
