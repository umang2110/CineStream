"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-full hover:bg-secondary transition-colors">
        <div className="h-5 w-5" />
      </button>
    )
  }

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-full hover:bg-secondary transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="h-5 w-5 text-foreground" />
      </button>

      {showMenu && (
        <>
          {/* Click away overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-44 bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-1.5">
              {options.map((opt) => {
                const isActive = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTheme(opt.value)
                      setShowMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <opt.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                    {opt.label}
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
