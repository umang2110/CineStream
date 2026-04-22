import { getCurrentUser } from "./auth"

function getStorageKey() {
  const user = getCurrentUser()
  return user ? `watchHistory_${user.email}` : "watchHistory"
}

export function getHistory(): number[] {
  if (typeof window === "undefined") return []
  const history = localStorage.getItem(getStorageKey())
  return history ? JSON.parse(history) : []
}

export function addToHistory(movieId: number): void {
  const history = getHistory()
  // Move to front if already exists, else just add to front
  const updated = [movieId, ...history.filter((id) => id !== movieId)]
  // Keep only last 50 entries
  localStorage.setItem(getStorageKey(), JSON.stringify(updated.slice(0, 50)))
  // Dispatch a custom event so components can react to history changes
  window.dispatchEvent(new CustomEvent("watchHistoryUpdated", { detail: { movieId } }))
}

export function removeFromHistory(movieId: number): void {
  const history = getHistory()
  const updated = history.filter((id) => id !== movieId)
  localStorage.setItem(getStorageKey(), JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent("watchHistoryUpdated"))
}

export function isWatched(movieId: number): boolean {
  return getHistory().includes(movieId)
}

export function getLatestWatchedId(): number | null {
  const history = getHistory()
  return history.length > 0 ? history[0] : null
}
