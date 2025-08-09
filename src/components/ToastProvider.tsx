import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from "react"
import type { Category } from "./types"
import { CATEGORY_DOT, CATEGORY_STYLES } from "./types"

type ToastKind = "success" | "info" | "error"

export type ToastInput = {
  id?: string
  message: string
  title?: string
  kind?: ToastKind
  duration?: number 
  category?: Category 
}

type Toast = {
  id: string
  message: string
  title: string
  kind: ToastKind
  duration: number
  category?: Category
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((input: ToastInput) => {
    const id = input.id ?? `t_${++idRef.current}`
    const toast: Toast = {
      id,
      message: input.message,
      title: input.title ?? "",
      kind: input.kind ?? "info",
      duration: input.duration ?? 3000,
      category: input.category,
    }
    setToasts((prev) => [...prev, toast])
  }, [])

  const value = useMemo(() => ({ toast: push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex max-h-[calc(100dvh-2rem)] w-[min(92vw,380px)] flex-col items-stretch gap-2 overflow-y-auto">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const inTimer = setTimeout(() => setMounted(true), 10)
    const outTimer = setTimeout(() => setClosing(true), toast.duration)
    return () => {
      clearTimeout(inTimer)
      clearTimeout(outTimer)
    }
  }, [toast.duration])

  useEffect(() => {
    if (closing) {
      const t = setTimeout(onRemove, 200)
      return () => clearTimeout(t)
    }
  }, [closing, onRemove])

  let borderClass = "border-gray-200"
  let dotClass = "bg-gray-500"

  if (toast.kind === "error") {
    borderClass = "border-red-200"
    dotClass = "bg-red-500"
  } else if (toast.category) {
    const styles = CATEGORY_STYLES[toast.category]
    borderClass = styles.border
    dotClass = CATEGORY_DOT[toast.category]
  } else if (toast.kind === "success") {
    borderClass = "border-emerald-200"
    dotClass = "bg-emerald-500"
  }

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-md border bg-white p-3 shadow-md transition-all duration-200 ${
        mounted && !closing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } ${borderClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
        <div className="min-w-0 flex-1">
          {toast.title ? (
            <div className="mb-0.5 text-sm font-medium text-gray-900">{toast.title}</div>
          ) : null}
          <div className="text-sm text-gray-700">{toast.message}</div>
        </div>
        <button
          className="ml-2 rounded p-1 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          onClick={() => setClosing(true)}
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
