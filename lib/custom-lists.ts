// ── Custom Lists — persisted in localStorage ──────────────────────────

export interface CustomList {
  id: string
  name: string
  emoji: string
  description: string
  movieIds: number[]
  createdAt: string // ISO date string
}

import { getCurrentUser } from "./auth"

function getStorageKey() {
  const user = getCurrentUser()
  return user ? `customLists_${user.email}` : "customLists"
}

// Preset list suggestions shown during creation
export const LIST_PRESETS = [
  { emoji: "🎉", name: "Weekend Watch", description: "Perfect picks for the weekend" },
  { emoji: "💑", name: "Date Night", description: "Romantic movies for two" },
  { emoji: "😂", name: "Comedy Night", description: "Laugh out loud picks" },
  { emoji: "👨‍👩‍👧‍👦", name: "Family Time", description: "Great movies for the whole family" },
  { emoji: "😱", name: "Scary Night", description: "Horror & thrillers for a scare" },
  { emoji: "🧠", name: "Must Watch", description: "Critically acclaimed must-sees" },
  { emoji: "🎬", name: "Director's Cut", description: "Auteur films to explore" },
  { emoji: "🚀", name: "Sci-Fi Marathon", description: "Space, robots and beyond" },
]

function generateId(): string {
  return `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function getAllLists(): CustomList[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(getStorageKey())
  return raw ? JSON.parse(raw) : []
}

function saveLists(lists: CustomList[]): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(lists))
}

export function createList(name: string, emoji: string, description: string): CustomList {
  const lists = getAllLists()
  const newList: CustomList = {
    id: generateId(),
    name: name.trim(),
    emoji,
    description: description.trim(),
    movieIds: [],
    createdAt: new Date().toISOString(),
  }
  lists.unshift(newList)
  saveLists(lists)
  return newList
}

export function updateList(id: string, updates: Partial<Pick<CustomList, "name" | "emoji" | "description">>): void {
  const lists = getAllLists()
  const idx = lists.findIndex((l) => l.id === id)
  if (idx !== -1) {
    lists[idx] = { ...lists[idx], ...updates }
    saveLists(lists)
  }
}

export function deleteList(id: string): void {
  const lists = getAllLists().filter((l) => l.id !== id)
  saveLists(lists)
}

export function addMovieToList(listId: string, movieId: number): void {
  const lists = getAllLists()
  const idx = lists.findIndex((l) => l.id === listId)
  if (idx !== -1 && !lists[idx].movieIds.includes(movieId)) {
    lists[idx].movieIds.unshift(movieId)
    saveLists(lists)
  }
}

export function removeMovieFromList(listId: string, movieId: number): void {
  const lists = getAllLists()
  const idx = lists.findIndex((l) => l.id === listId)
  if (idx !== -1) {
    lists[idx].movieIds = lists[idx].movieIds.filter((id) => id !== movieId)
    saveLists(lists)
  }
}

export function isMovieInList(listId: string, movieId: number): boolean {
  const list = getAllLists().find((l) => l.id === listId)
  return list ? list.movieIds.includes(movieId) : false
}

export function getListsContainingMovie(movieId: number): CustomList[] {
  return getAllLists().filter((l) => l.movieIds.includes(movieId))
}
