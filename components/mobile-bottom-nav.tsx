"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Grid3x3, Bell, Clock, Heart } from "lucide-react"

const navItems = [
  { href: "/home",       label: "Home",      icon: Home       },
  { href: "/categories", label: "Browse",    icon: Grid3x3    },
  { href: "/upcoming",   label: "Alerts",    icon: Bell       },
  { href: "/history",    label: "History",   icon: Clock      },
  { href: "/profile",    label: "My List",   icon: Heart      },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  // Hide on login / register pages
  if (["/login", "/register"].includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 relative
                transition-colors duration-200
                ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              {/* Active pill indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}

              <span className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                <Icon
                  className={`h-5 w-5 transition-all duration-200 ${active ? "stroke-[2.5px]" : "stroke-[1.5px]"}`}
                  fill={active ? "currentColor" : "none"}
                />
              </span>
              <span className={`text-[10px] font-medium leading-none transition-all duration-200 ${active ? "font-bold" : ""}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
