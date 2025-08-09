"use client"

import type { DragEndEvent } from "@dnd-kit/core"
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  addDays,
  differenceInCalendarDays,
} from "date-fns"
import { useEffect, useMemo, useRef, useState } from "react"
import TaskBar from "./TaskBar"
import type { Filters, Task } from "./types"

type Props = {
  year: number
  month: number
  tasks: Task[]
  filters: Filters
  onMoveDays: (id: string, deltaDays: number) => void
  onResizeTo: (id: string, edge: "start" | "end", newDateISO: string) => void
  onCreateRequest: (range: { startISO: string; endISO: string }) => void
  onTaskClick: (task: Task) => void
  onMonthChange?: (delta: -1 | 1) => void
  onGoToday?: () => void
}

type Segment = {
  task: Task
  weekRow: number
  startCol: number
  endCol: number
  lane: number
}

function useMonthGrid(year: number, month: number) {
  const first = startOfMonth(new Date(year, month, 1))
  const last = endOfMonth(first)
  const gridStart = startOfWeek(first, { weekStartsOn: 0 })
  let gridEnd = endOfWeek(last, { weekStartsOn: 0 })

  const totalDays = differenceInCalendarDays(gridEnd, gridStart) + 1
  if (totalDays < 42) {
    gridEnd = addDays(gridEnd, 42 - totalDays)
  }

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const weeks = Array.from({ length: 6 }, (_, r) => days.slice(r * 7, r * 7 + 7))
  return { weeks, first }
}

function intersectsFilters(task: Task, filters: Filters): boolean {
  const categoryPass = filters.categories.size === 0 || filters.categories.has(task.category)
  if (!categoryPass) return false

  const q = (filters as any).search ? String(filters.search).trim().toLowerCase() : ""
  if (q && !task.title.toLowerCase().includes(q)) return false

  if (!filters.timeWindow) return true
  const now = new Date()
  const until = addDays(now, filters.timeWindow)
  const start = parseISO(task.start)
  const end = parseISO(task.end)
  return !(end < now || start > until)
}

export default function Calendar({
  year,
  month,
  tasks,
  filters,
  onMoveDays,
  onResizeTo,
  onCreateRequest,
  onTaskClick,
  onMonthChange,
  onGoToday,
}: Props) {
  const { weeks, first } = useMonthGrid(year, month)
  const containerRef = useRef<HTMLDivElement>(null)

  const [geom, setGeom] = useState<{
    colLefts: number[]
    colWidth: number
    rowAnchors: number[]
  }>({ colLefts: Array(7).fill(0), colWidth: 0, rowAnchors: Array(6).fill(0) })

  const colMeasureRefs = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))
  const rowAnchorRefs = useRef<(HTMLDivElement | null)[]>(Array(6).fill(null))

  const [selecting, setSelecting] = useState<null | { start: string; end: string }>(null)
  const [selectStartIdx, setSelectStartIdx] = useState<number | null>(null)

  const laneH = 24
  const pad = 2

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const crect = el.getBoundingClientRect()
      const lefts: number[] = []
      let colW = 0
      for (let c = 0; c < 7; c++) {
        const cell = colMeasureRefs.current[c]
        if (cell) {
          const r = cell.getBoundingClientRect()
          lefts[c] = r.left - crect.left
          if (c === 0) colW = r.width
        }
      }
      const anchors: number[] = []
      for (let rIdx = 0; rIdx < 6; rIdx++) {
        const anchor = rowAnchorRefs.current[rIdx]
        if (anchor) {
          const ar = anchor.getBoundingClientRect()
          anchors[rIdx] = ar.top - crect.top
        }
      }
      if (lefts.length === 7 && colW > 0 && anchors.every((v) => Number.isFinite(v))) {
        setGeom({ colLefts: lefts, colWidth: colW, rowAnchors: anchors })
      }
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [weeks.length])

  const flatDays = useMemo(() => weeks.flat(), [weeks])

  function onMouseDownCell(idx: number) {
    const d = flatDays[idx]
    setSelecting({ start: format(d, "yyyy-MM-dd"), end: format(d, "yyyy-MM-dd") })
    setSelectStartIdx(idx)
  }
  function onMouseEnterCell(idx: number) {
    if (selecting && selectStartIdx !== null) {
      const s = Math.min(selectStartIdx, idx)
      const e = Math.max(selectStartIdx, idx)
      setSelecting({ start: format(flatDays[s], "yyyy-MM-dd"), end: format(flatDays[e], "yyyy-MM-dd") })
    }
  }
  function onMouseUpGrid() {
    if (selecting) {
      const range = { startISO: selecting.start, endISO: selecting.end }
      setSelecting(null)
      setSelectStartIdx(null)
      onCreateRequest(range)
    }
  }

  const segments = useMemo<Segment[]>(() => {
    const segs: Segment[] = []
    weeks.forEach((week, row) => {
      const weekStart = week[0]
      const weekEnd = week[6]
      const weekTasks = tasks
        .filter((t) => intersectsFilters(t, filters))
        .filter((t) => !(parseISO(t.end) < weekStart || parseISO(t.start) > weekEnd))
        .map((t) => {
          const s = parseISO(t.start) < weekStart ? weekStart : parseISO(t.start)
          const e = parseISO(t.end) > weekEnd ? weekEnd : parseISO(t.end)
          const startCol = week.findIndex((d) => isSameDay(d, s))
          const endCol = week.findIndex((d) => isSameDay(d, e))
          return { task: t, startCol, endCol, weekRow: row }
        })

      const lanes: number[] = []
      weekTasks
        .sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol)
        .forEach((seg) => {
          let lane = 0
          while (lane < lanes.length && lanes[lane] >= seg.startCol) lane++
          if (lane === lanes.length) lanes.push(seg.endCol)
          else lanes[lane] = seg.endCol
          segs.push({ ...seg, lane })
        })
    })
    return segs
  }, [weeks, tasks, filters])

  const selectionBands = useMemo(() => {
    if (!selecting || geom.colWidth === 0) return []

    const startIdx = flatDays.findIndex((d) => isSameDay(d, parseISO(selecting.start)))
    const endIdx = flatDays.findIndex((d) => isSameDay(d, parseISO(selecting.end)))
    if (startIdx === -1 || endIdx === -1) return []

    const s = Math.min(startIdx, endIdx)
    const e = Math.max(startIdx, endIdx)

    let sDate = parseISO(selecting.start)
    let eDate = parseISO(selecting.end)
    if (eDate < sDate) {
      const tmp = sDate
      sDate = eDate
      eDate = tmp
    }
    const days = Math.abs(differenceInCalendarDays(eDate, sDate)) + 1
    const rangeLabel = `${format(sDate, "MMM d")} to ${format(eDate, "MMM d")} (${days}d)`

    const bands: { row: number; startCol: number; endCol: number }[] = []
    const startRow = Math.floor(s / 7)
    const endRow = Math.floor(e / 7)
    for (let row = startRow; row <= endRow; row++) {
      const rowStartCol = row === startRow ? s % 7 : 0
      const rowEndCol = row === endRow ? e % 7 : 6
      bands.push({ row, startCol: rowStartCol, endCol: rowEndCol })
    }

    return bands.map((b) => {
      const leftStart = geom.colLefts[b.startCol] ?? 0
      const rightEnd = (geom.colLefts[b.endCol] ?? 0) + geom.colWidth
      const left = leftStart + pad
      const topBase = geom.rowAnchors[b.row] ?? 0

      const occupied = new Set<number>()
      segments.forEach((seg) => {
        if (seg.weekRow !== b.row) return
        const overlaps = !(seg.endCol < b.startCol || seg.startCol > b.endCol)
        if (overlaps) occupied.add(seg.lane)
      })
      let laneForSelection = 0
      while (occupied.has(laneForSelection)) laneForSelection++

      const top = topBase + laneForSelection * (laneH + 4)
      const width = Math.max(0, rightEnd - leftStart - pad * 2)
      const height = laneH

      return { key: `sel-${b.row}-${b.startCol}-${b.endCol}`, left, top, width, height, label: rangeLabel }
    })
  }, [selecting, geom, flatDays, segments])

  function segRect(seg: Segment) {
    const leftStart = geom.colLefts[seg.startCol] ?? 0
    const rightEnd = (geom.colLefts[seg.endCol] ?? 0) + geom.colWidth
    const left = leftStart + pad
    const topBase = geom.rowAnchors[seg.weekRow] ?? 0
    const top = topBase + seg.lane * (laneH + 4)
    const width = Math.max(0, rightEnd - leftStart - pad * 2)
    const height = laneH
    return { left, top, width, height }
  }

  function handleDragEnd(ev: DragEndEvent) {
    const days = Math.round(ev.delta.x / (geom.colWidth || 1))
    const taskId = ev.active?.data?.current?.taskId as string | undefined
    if (taskId && days !== 0) onMoveDays(taskId, days)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="text-lg font-semibold">{format(new Date(year, month, 1), "MMMM yyyy")}</div>
        <div className="flex gap-2">
          {onMonthChange && (
            <>
              <button
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                onClick={() => onMonthChange(-1)}
              >
                Prev
              </button>
              {onGoToday && (
                <button
                  className="rounded-md border px-3 py-1 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  onClick={() => onGoToday()}
                  title="Jump to current month"
                >
                  Today
                </button>
              )}
              <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50" onClick={() => onMonthChange(1)}>
                Next
              </button>
            </>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div
          ref={containerRef}
          className="relative grid flex-1 select-none grid-cols-7 grid-rows-[auto_repeat(6,1fr)] overflow-hidden rounded-lg border"
          onMouseUp={onMouseUpGrid}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="h-8 border-b bg-gray-50 px-2 py-1 text-sm font-medium">
              {d}
            </div>
          ))}

          {weeks.map((week, row) =>
            week.map((date, col) => {
              const outside = !isSameMonth(date, first)
              const today = isToday(date)

              const idx = row * 7 + col
              const isInDrag = selecting && parseISO(selecting.start) <= date && date <= parseISO(selecting.end)

              const baseBg = outside ? "bg-gray-50/50" : "bg-white"
              let bgClass = baseBg
              if (isInDrag) bgClass = "bg-sky-50"
              if (today) bgClass = "bg-emerald-200"

              return (
                <div
                  key={date.toISOString()}
                  className={`relative border-b border-r p-1 ${bgClass}`}
                  onMouseDown={() => onMouseDownCell(idx)}
                  onMouseEnter={() => onMouseEnterCell(idx)}
                  ref={
                    row === 0
                      ? (node) => {
                          if (node) colMeasureRefs.current[col] = node
                        }
                      : undefined
                  }
                >
                  <div
                    className="pointer-events-none relative z-[90] flex items-center justify-between px-0.5"
                    style={{ height: 25 }}
                  >
                    <div className={`text-xs ${outside ? "text-gray-400" : "text-gray-700"}`}>
                      {today ? (
                        <b>
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-semibold text-white">
                            {format(date, "d")}
                          </span>
                        </b>
                      ) : (
                        <b>
                          <span>{format(date, "d")}</span>
                        </b>
                      )}
                    </div>
                  </div>

                  {col === 0 && (
                    <div
                      ref={(node) => {
                        if (node) rowAnchorRefs.current[row] = node
                      }}
                      className="h-0 w-0"
                    />
                  )}
                </div>
              )
            }),
          )}

          {selectionBands.map((b) => (
            <div
              key={b.key}
              className="pointer-events-none absolute z-[15] rounded-2xl bg-emerald-400/25 ring-1 ring-emerald-500/40"
              style={{
                left: b.left,
                top: b.top,
                width: b.width,
                height: b.height,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="pointer-events-none whitespace-nowrap text-[11px] font-semibold text-emerald-700/75">
                  {"selecting "} ( {b.label} )
                </span>
              </div>
            </div>
          ))}

          {segments.map((seg) => {
            const { left, top, width, height } = segRect(seg)
            return (
              <TaskBar
                key={`${seg.task.id}-${seg.weekRow}-${seg.lane}-${seg.startCol}`}
                task={seg.task}
                leftPx={left}
                topPx={top}
                widthPx={width}
                heightPx={height}
                cellWidth={geom.colWidth || 1}
                cellHeight={0}
                headerHeight={0}
                gridPadding={0}
                onMoveDays={onMoveDays}
                onResizeTo={onResizeTo}
                onClick={onTaskClick}
              />
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}