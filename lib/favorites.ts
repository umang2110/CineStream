import { getCurrentUser } from "./auth"

function getFavoritesKey() {
  const user = getCurrentUser()
  return user ? `favorites_${user.email}` : "favorites"
}

function getGenrePrefsKey() {
  const user = getCurrentUser()
  return user ? `genrePreferences_${user.email}` : "genrePreferences"
}

export function getFavorites(): number[] {
  if (typeof window === "undefined") return []
  const favs = localStorage.getItem(getFavoritesKey())
  return favs ? JSON.parse(favs) : []
}

export function addToFavorites(movieId: number): void {
  const favorites = getFavorites()
  if (!favorites.includes(movieId)) {
    favorites.push(movieId)
    localStorage.setItem(getFavoritesKey(), JSON.stringify(favorites))
  }
}

export function removeFromFavorites(movieId: number): void {
  const favorites = getFavorites()
  const updated = favorites.filter((id) => id !== movieId)
  localStorage.setItem(getFavoritesKey(), JSON.stringify(updated))
}

export function isFavorite(movieId: number): boolean {
  return getFavorites().includes(movieId)
}

export function getGenrePreferences(): Record<string, number> {
  if (typeof window === "undefined") return {}
  const prefs = localStorage.getItem(getGenrePrefsKey())
  return prefs ? JSON.parse(prefs) : {}
}

export function updateGenrePreferences(genres: string[]): void {
  const prefs = getGenrePreferences()
  genres.forEach((genre) => {
    prefs[genre] = (prefs[genre] || 0) + 1
  })
  localStorage.setItem(getGenrePrefsKey(), JSON.stringify(prefs))
}
