"use client"

import { useDraggable } from "@dnd-kit/core"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { Task } from "./types"
import { CATEGORY_DOT, CATEGORY_LABELS, CATEGORY_COLORS } from "./types"
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns"

type Props = {
  task: Task
  cellWidth: number
  cellHeight: number
  headerHeight: number
  gridPadding: number
  leftPx: number
  topPx: number
  widthPx: number
  heightPx: number
  onMoveDays: (id: string, deltaDays: number) => void
  onResizeTo: (id: string, edge: "start" | "end", newDateISO: string) => void
  onClick: (task: Task) => void
}

export default function TaskBar({ task, leftPx, topPx, widthPx, heightPx, cellWidth, onResizeTo, onClick }: Props) {
  const id = `task-${task.id}`
  const wrapperRef = useRef<HTMLDivElement>(null)
  const suppressClickRef = useRef(false)

  const [resizing, setResizing] = useState<null | {
    edge: "start" | "end"
    startX: number
    startISO: string
    endISO: string
  }>(null)

  const [dragDeltaPx, setDragDeltaPx] = useState(0)

  const [preview, setPreview] = useState<{ startISO: string; endISO: string } | null>(null)

  const [showTooltip, setShowTooltip] = useState(false)
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [, setOverHandle] = useState(false)
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("above")

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { taskId: task.id },
    disabled: !!resizing,
  })

  function computeDeltaDays(px: number, edge: "start" | "end", cellW: number) {
    const ratio = px / cellW
    if (edge === "start") {
      return Math.floor(ratio)
    } else {
      return Math.ceil(ratio)
    }
  }

  useEffect(() => {
    if (!resizing) return

    const onMove = (e: PointerEvent) => {
      e.preventDefault()

      const rawPx = e.clientX - resizing.startX
      const minBarWidthPx = 6

      let px = rawPx
      if (resizing.edge === "start") {
        const maxRight = Math.max(0, widthPx - minBarWidthPx)
        px = Math.min(px, maxRight)
      } else {
        const maxLeft = -Math.max(0, widthPx - minBarWidthPx)
        px = Math.max(px, maxLeft)
      }

      setDragDeltaPx(px)

      const deltaDays = computeDeltaDays(px, resizing.edge, cellWidth)
      if (deltaDays === 0) {
        setPreview({ startISO: resizing.startISO, endISO: resizing.endISO })
        return
      }

      if (resizing.edge === "start") {
        const newStart = addDays(parseISO(resizing.startISO), deltaDays)
        if (newStart > parseISO(resizing.endISO)) return
        setPreview({ startISO: format(newStart, "yyyy-MM-dd"), endISO: resizing.endISO })
      } else {
        const newEnd = addDays(parseISO(resizing.endISO), deltaDays)
        if (newEnd < parseISO(resizing.startISO)) return
        setPreview({ startISO: resizing.startISO, endISO: format(newEnd, "yyyy-MM-dd") })
      }
    }

    const onUp = (e: PointerEvent) => {
      e.preventDefault()

      if (preview && resizing) {
        const edge = resizing.edge
        const newISO = edge === "start" ? preview.startISO : preview.endISO
        if (newISO !== (edge === "start" ? resizing.startISO : resizing.endISO)) {
          onResizeTo(task.id, edge, newISO)
        }
      }
      setResizing(null)
      setPreview(null)
      setDragDeltaPx(0)

      setTimeout(() => {
        suppressClickRef.current = false
      }, 150)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.style.cursor = ""
    }

    window.addEventListener("pointermove", onMove, { passive: false })
    window.addEventListener("pointerup", onUp, { passive: false })
    document.body.style.cursor = "ew-resize"
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.style.cursor = ""
    }
  }, [resizing, preview, cellWidth, onResizeTo, task.id, widthPx])

  useEffect(() => {
    if (!showTooltip) return
    const bar = wrapperRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const vh = window.innerHeight
    const nearTop = rect.top < 120
    const nearBottom = vh - rect.bottom < 140
    setTooltipPlacement(nearTop ? "below" : nearBottom ? "above" : "above")
  }, [showTooltip])

  const x = transform?.x ?? 0
  const startDate = parseISO(task.start)
  const endDate = parseISO(task.end)

  const bgClass = CATEGORY_COLORS[task.category]
  const dotClass = CATEGORY_DOT[task.category]

  const previewStart = preview ? parseISO(preview.startISO) : null
  const previewEnd = preview ? parseISO(preview.endISO) : null

  const effectiveStart = previewStart ?? startDate
  const effectiveEnd = previewEnd ?? endDate
  const effectiveDays = differenceInCalendarDays(effectiveEnd, effectiveStart) + 1

  let extendLeftPx = 0
  let shrinkLeftPx = 0
  let extendRightPx = 0
  let shrinkRightPx = 0
  if (resizing) {
    if (resizing.edge === "start") {
      extendLeftPx = Math.max(0, -dragDeltaPx)
      shrinkLeftPx = Math.max(0, dragDeltaPx)
    } else {
      extendRightPx = Math.max(0, dragDeltaPx)
      shrinkRightPx = Math.max(0, -dragDeltaPx)
    }
  }

  const createdAtText = format(new Date(task.createdAt), "PP p")

  const tooltipTransform = tooltipPlacement === "above" ? "translateX(-50%) translateY(-100%)" : "translateX(-50%)"

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const rect = wrapperRef.current?.getBoundingClientRect()
  const clampedX = clamp(mouseX ?? widthPx / 2, 8, widthPx - 8)
  const tooltipLeft = rect ? rect.left + clampedX : 0
  const tooltipTopPx = rect ? rect.top + (tooltipPlacement === "above" ? -6 : heightPx + 6) : 0

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        wrapperRef.current = node
      }}
      {...attributes}
      {...listeners}
      className={`absolute select-none rounded-md border px-3 py-1.5 text-xs shadow-sm transition-colors ${bgClass}`}
      style={{
        left: leftPx + x,
        top: topPx,
        width: widthPx,
        height: heightPx,
        cursor: resizing ? "ew-resize" : "grab",
        touchAction: "none",
        overflow: "visible",
        opacity: isDragging ? 0.85 : resizing ? 0.95 : 1,
        zIndex: isDragging || !!resizing || showTooltip ? 200 : 5,
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (suppressClickRef.current || resizing) return
        onClick(task)
      }}
      onMouseEnter={() => !isDragging && !resizing && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onMouseMove={(e) => setMouseX(e.nativeEvent.offsetX)}
    >
      {resizing && (
        <div className="pointer-events-none absolute -top-4 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-gray-500">
          {resizing.edge === "start" ? "Dragging from start" : "Dragging from end"} • {effectiveDays}d
        </div>
      )}

      <div className="flex h-full w-full items-center justify-start gap-2 text-left">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="truncate font-medium">{task.title}</span>
      </div>

      <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-100">
        {effectiveDays}d
      </div>

      <div
        className="absolute left-0 top-0 z-20 h-full w-3 cursor-ew-resize rounded-l-md bg-black/10 hover:bg-black/20 active:bg-black/30"
        onPointerDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          suppressClickRef.current = true
          setShowTooltip(false)
          setResizing({ edge: "start", startX: e.clientX, startISO: task.start, endISO: task.end })
          setPreview({ startISO: task.start, endISO: task.end })
          setDragDeltaPx(0)
        }}
        title="Drag to resize start"
        onMouseEnter={(e) => {
          e.stopPropagation()
          setShowTooltip(false)
          setOverHandle(true)
        }}
        onMouseLeave={() => setOverHandle(false)}
      />
      <div
        className="absolute right-0 top-0 z-20 h-full w-3 cursor-ew-resize rounded-r-md bg-black/10 hover:bg-black/20 active:bg-black/30"
        onPointerDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          suppressClickRef.current = true
          setShowTooltip(false)
          setResizing({ edge: "end", startX: e.clientX, startISO: task.start, endISO: task.end })
          setPreview({ startISO: task.start, endISO: task.end })
          setDragDeltaPx(0)
        }}
        title="Drag to resize end"
        onMouseEnter={(e) => {
          e.stopPropagation()
          setShowTooltip(false)
          setOverHandle(true)
        }}
        onMouseLeave={() => setOverHandle(false)}
      />

      {resizing && (extendLeftPx > 0 || extendRightPx > 0) && (
        <>
          {extendLeftPx > 0 && (
            <div
              className={`pointer-events-none absolute top-0 h-full rounded-l-md ${dotClass}`}
              style={{ left: -extendLeftPx, width: extendLeftPx, opacity: 0.6 }}
            />
          )}
          {extendRightPx > 0 && (
            <div
              className={`pointer-events-none absolute top-0 h-full rounded-r-md ${dotClass}`}
              style={{ left: widthPx, width: extendRightPx, opacity: 0.6 }}
            />
          )}
        </>
      )}
      {resizing && (shrinkLeftPx > 0 || shrinkRightPx > 0) && (
        <>
          {shrinkLeftPx > 0 && (
            <div
              className="pointer-events-none absolute top-0 h-full rounded-l-2xl bg-black/10"
              style={{ left: 0, width: Math.min(shrinkLeftPx, widthPx) }}
            />
          )}
          {shrinkRightPx > 0 && (
            <div
              className="pointer-events-none absolute top-0 h-full rounded-r-2xl bg-black/10"
              style={{ left: Math.max(0, widthPx - shrinkRightPx), width: Math.min(shrinkRightPx, widthPx) }}
            />
          )}
        </>
      )}

      {preview && <div className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-white/80" />}

      {showTooltip &&
        !isDragging &&
        !resizing &&
        wrapperRef.current &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[5000] rounded-md border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-900 shadow-2xl"
            style={{
              left: tooltipLeft,
              top: tooltipTopPx,
              transform: tooltipTransform,
              maxWidth: 260,
              whiteSpace: "nowrap",
              opacity: 1,
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dotClass}`} />
              <span className="font-semibold text-gray-900">{task.title}</span>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
              <span className="text-gray-600">Task</span>
              <span className="truncate">{task.title}</span>
              <span className="text-gray-600">Category</span>
              <span>{CATEGORY_LABELS[task.category]}</span>
              <span className="text-gray-600">Created</span>
              <span>{createdAtText}</span>
              <span className="text-gray-600">Range</span>
              <span>
                {task.start} → {task.end} ({differenceInCalendarDays(endDate, startDate) + 1}d)
              </span>
            </div>
            <div
              className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-gray-200 bg-white ${
                tooltipPlacement === "above" ? "top-full border-b border-r" : "bottom-full border-t border-l"
              }`}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}