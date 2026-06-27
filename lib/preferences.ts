export interface Person {
  id: number;
  name: string;
  profilePath?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface UserPreferences {
  firstName: string;
  lastName: string;
  dob: string;
  favoriteGenres: Genre[];
  favoriteActors: Person[];
}

import { getCurrentUser } from "./auth"

function getPreferencesKey() {
  const user = getCurrentUser()
  return user ? `user_preferences_${user.email}` : "user_preferences"
}

export function savePreferences(preferences: UserPreferences): void {
  localStorage.setItem(getPreferencesKey(), JSON.stringify(preferences))
}

export function getPreferences(): UserPreferences | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(getPreferencesKey())
  return stored ? JSON.parse(stored) : null
}

export function hasPreferences(): boolean {
  return getPreferences() !== null
}

export const availableGenres = [
  "Action",
  "Adventure",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
]

export const availableLanguages = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "gujarati", label: "Gujarati" },
  { value: "italian", label: "Italian" },
]
