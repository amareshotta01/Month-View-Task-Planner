
export type Category = "todo" | "in-progress" | "review" | "completed"

export const CATEGORY_LABELS: Record<Category, string> = {
  "todo": "To Do",
  "in-progress": "In Progress",
  "review": "Review",
  "completed": "Completed",
}

export const CATEGORY_COLORS: Record<Category, string> = {
  "todo": "bg-sky-500 hover:bg-sky-600",
  "in-progress": "bg-amber-500 hover:bg-amber-600",
  "review": "bg-fuchsia-500 hover:bg-fuchsia-600",
  "completed": "bg-emerald-500 hover:bg-emerald-600",
}

export const CATEGORY_DOT: Record<Category, string> = {
  "todo": "bg-sky-500",
  "in-progress": "bg-amber-500",
  "review": "bg-fuchsia-500",
  "completed": "bg-emerald-500",
}

export const CATEGORY_ACCENT: Record<Category, string> = {
  todo: "#0ea5e9",
  "in-progress": "#f59e0b",
  review: "#d946ef",
  completed: "#10b981",
}

export const CATEGORY_STYLES: Record<Category, {
  bg: string; border: string; text: string; hover: string;
  darkBg: string; darkBorder: string; darkText: string;
}> = {
  "todo": {
    bg: "bg-sky-50",
    border: "border-sky-300",
    text: "text-sky-700",
    hover: "hover:bg-sky-100",
    darkBg: "dark:bg-sky-950/30",
    darkBorder: "dark:border-sky-700",
    darkText: "dark:text-sky-200",
  },
  "in-progress": {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    hover: "hover:bg-amber-100",
    darkBg: "dark:bg-amber-950/30",
    darkBorder: "dark:border-amber-700",
    darkText: "dark:text-amber-200",
  },
  "review": {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-300",
    text: "text-fuchsia-700",
    hover: "hover:bg-fuchsia-100",
    darkBg: "dark:bg-fuchsia-950/30",
    darkBorder: "dark:border-fuchsia-700",
    darkText: "dark:text-fuchsia-200",
  },
  "completed": {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    hover: "hover:bg-emerald-100",
    darkBg: "dark:bg-emerald-950/30",
    darkBorder: "dark:border-emerald-700",
    darkText: "dark:text-emerald-200",
  },
}

export type Task = {
  id: string
  title: string
  category: Category
  start: string
  end: string 
  createdAt: number
}

export type TimeWindow = 7 | 14 | 21 | null

export type Filters = {
  categories: Set<Category>
  timeWindow: TimeWindow
  search: string 
}
