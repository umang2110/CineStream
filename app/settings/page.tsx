"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Navbar } from "@/components/navbar"
import { isAuthenticated, getCurrentUser, getSavedAccounts, switchAccount, removeAccount, logout, type User as AuthUser } from "@/lib/auth"
import { getFavorites } from "@/lib/favorites"
import {
  Sun, Moon, Monitor, Settings, Palette, Bell, Globe, Shield, User,
  ChevronRight, Check, Trash2, Clock, Sparkles, Filter, CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [savedAccounts, setSavedAccounts] = useState<AuthUser[]>([])
  const [favCount, setFavCount] = useState(0)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Notification preferences (local state)
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cinestream_notifications")
      return saved ? JSON.parse(saved) : { newReleases: true, recommendations: true, watchlist: false }
    }
    return { newReleases: true, recommendations: true, watchlist: false }
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)
    setUser(getCurrentUser())
    setSavedAccounts(getSavedAccounts())
    setFavCount(getFavorites().length)
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleSwitchAccount = (email: string) => {
    if (switchAccount(email)) {
      window.location.reload()
    }
  }

  const handleRemoveAccount = (email: string) => {
    removeAccount(email)
    setSavedAccounts(getSavedAccounts())
    if (email === user?.email) {
      router.push("/login")
    }
  }

  const saveNotifications = (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
    localStorage.setItem("cinestream_notifications", JSON.stringify(updated))
  }

  const clearWatchHistory = () => {
    localStorage.removeItem("cinestream_favorites")
    localStorage.removeItem("cinestream_genre_prefs")
    setFavCount(0)
    setShowClearConfirm(false)
  }

  if (!mounted) return null

  const themeOptions = [
    { value: "light", label: "Light", description: "Clean & bright interface", icon: Sun, color: "text-amber-500" },
    { value: "dark", label: "Dark", description: "Cinematic dark experience", icon: Moon, color: "text-blue-400" },
    { value: "system", label: "System", description: "Match your device settings", icon: Monitor, color: "text-emerald-400" },
  ]

  // Content preferences removed (language selection)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground text-sm">Customize your CineStream experience</p>
            </div>
          </div>

          {/* Account section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Account
              </h2>
            </div>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user?.email || "User"}</p>
                    <p className="text-sm text-primary mb-1">Active Account</p>
                    <p className="text-xs text-muted-foreground">{favCount} movies in your list</p>
                  </div>
                </div>
                <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                  Log out
                </Button>
              </div>

              {/* Saved Accounts */}
              {savedAccounts.filter((a) => a.email !== user?.email).length > 0 && (
                <div className="border-t border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Saved Accounts</h3>
                  <div className="space-y-3">
                    {savedAccounts
                      .filter((a) => a.email !== user?.email)
                      .map((account) => (
                        <div key={account.email} className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium">{account.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleSwitchAccount(account.email)}>
                              Switch
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveAccount(account.email)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-border bg-secondary/10 p-4 flex flex-wrap gap-3">
                <Button asChild size="sm" variant="outline" className="bg-background">
                  <Link href="/login">Add another account</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Watch History Section */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Watch History
            </h2>
            <div className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
               <div>
                  <h3 className="text-sm font-semibold text-foreground">Your Viewing History</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Track the trailers and movies you've discovered</p>
               </div>
               <Button asChild variant="secondary" size="sm">
                 <Link href="/history">View History</Link>
               </Button>
            </div>
          </section>

          {/* Upcoming Movies Section */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
              Upcoming Releases
            </h2>
            <div className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
               <div>
                  <h3 className="text-sm font-semibold text-foreground">Movie Calendar</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Explore blockbusters coming in the next 12 months</p>
               </div>
               <Button asChild variant="secondary" size="sm">
                 <Link href="/upcoming">View Schedule</Link>
               </Button>
            </div>
          </section>

          {/* Recommendations Section */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              AI Recommendations
            </h2>
            <div className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
               <div>
                  <h3 className="text-sm font-semibold text-foreground">Personalized Suggestions</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Movies curated for you based on your activity</p>
               </div>
               <Button asChild variant="secondary" size="sm">
                 <Link href="/recommendations">View Suggestions</Link>
               </Button>
            </div>
          </section>

          {/* Movie Preferences Section */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-emerald-500" />
              Movie Preferences
            </h2>
            <div className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
               <div>
                  <h3 className="text-sm font-semibold text-foreground">Profiling & Tastes</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Edit your favorite categories and actors</p>
               </div>
               <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10" size="sm">
                 <Link href="/preferences">Edit Preferences</Link>
               </Button>
            </div>
          </section>

          {/* Appearance section — THEME */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Palette className="h-3.5 w-3.5" />
              Appearance
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground mb-1">Theme</h3>
                <p className="text-sm text-muted-foreground mb-5">Choose how CineStream looks to you</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mounted && themeOptions.map((opt) => {
                    const isActive = theme === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${isActive
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/30 hover:bg-secondary/50"
                          }`}
                      >
                        {/* Active check */}
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}

                        {/* Preview */}
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${opt.value === "light" ? "bg-white border border-gray-200 shadow-sm" :
                          opt.value === "dark" ? "bg-gray-900 border border-gray-700" :
                            "bg-gradient-to-br from-white to-gray-900 border border-gray-400"
                          }`}>
                          <opt.icon className={`h-7 w-7 ${opt.color}`} />
                        </div>

                        <div className="text-center">
                          <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Content Preferences removed */}

          {/* Notifications */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {[
                { key: "newReleases", label: "New Releases", desc: "Get notified about new movie releases" },
                { key: "recommendations", label: "Recommendations", desc: "Personalized movie suggestions" },
                { key: "watchlist", label: "Watchlist Reminders", desc: "Reminders for movies in your list" },
              ].map((item) => (
                <div key={item.key} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => saveNotifications(item.key, !notifications[item.key])}
                    className={`relative w-11 h-6 rounded-full inline-flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                       notifications[item.key] ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span 
                      className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                        notifications[item.key] ? "translate-x-5" : "translate-x-1"
                      }`} 
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Data & Privacy */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              Data & Privacy
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Clear Watch History & Preferences</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Remove all your saved data from this device</p>
                  </div>
                  {!showClearConfirm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setShowClearConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Clear Data
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowClearConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={clearWatchHistory}
                      >
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* App info */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
            <p>CineStream v2.0 • Powered by TMDB API</p>
            <p className="mt-1">Made with ❤️ for movie lovers</p>
          </div>
        </div>
      </main>
    </div>
  )
}
