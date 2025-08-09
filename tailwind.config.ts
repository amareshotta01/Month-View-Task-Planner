import type { Config } from "tailwindcss"

export default {
  // darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sky: { 500: "#0ea5e9", 600: "#0284c7" },
        amber: { 500: "#f59e0b", 600: "#d97706" },
        fuchsia: { 500: "#d946ef", 600: "#a21caf" },
        emerald: { 500: "#10b981", 600: "#059669" }
      }
    }
  },
  plugins: []
} satisfies Config
