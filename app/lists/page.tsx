"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { MovieModal } from "@/components/movie-modal"
import { isAuthenticated } from "@/lib/auth"
import {
  getAllLists,
  createList,
  updateList,
  deleteList,
  removeMovieFromList,
  LIST_PRESETS,
  type CustomList,
} from "@/lib/custom-lists"
import { fetchMovieByIdData, type Movie } from "@/lib/movie-data"
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ListMusic,
  ChevronRight,
  ArrowLeft,
  Star,
  Loader2,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const EMOJI_OPTIONS = ["🎬", "🍿", "❤️", "😂", "😱", "🚀", "🧠", "🎉", "💑", "👨‍👩‍👧‍👦", "🔥", "✨", "🏆", "🌙", "🎭", "🌊"]

// ── Types ──────────────────────────────────────────────────────────────
interface MovieCache {
  [id: number]: Movie | null
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

// ── Component ──────────────────────────────────────────────────────────
export default function ListsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [lists, setLists] = useState<CustomList[]>([])

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmoji, setNewEmoji] = useState("🎬")
  const [newDesc, setNewDesc] = useState("")
  const [showPresets, setShowPresets] = useState(false)

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmoji, setEditEmoji] = useState("🎬")
  const [editDesc, setEditDesc] = useState("")

  // Detail view
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [movieCache, setMovieCache] = useState<MovieCache>({})
  const [loadingMovies, setLoadingMovies] = useState(false)

  // Movie modal
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return }
    setMounted(true)
    setLists(getAllLists())
  }, [router])

  const refresh = useCallback(() => setLists(getAllLists()), [])

  // Load movies for the active list
  const activeList = lists.find((l) => l.id === activeListId) ?? null

  useEffect(() => {
    if (!activeList) return
    const uncached = activeList.movieIds.filter((id) => !(id in movieCache))
    if (uncached.length === 0) return

    setLoadingMovies(true)
    Promise.all(uncached.map((id) => fetchMovieByIdData(id).then((m) => [id, m] as [number, Movie | null])))
      .then((results) => {
        setMovieCache((prev) => {
          const next = { ...prev }
          results.forEach(([id, m]) => { next[id] = m })
          return next
        })
      })
      .finally(() => setLoadingMovies(false))
  }, [activeList?.id, activeList?.movieIds.join(",")])

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!newName.trim()) return
    createList(newName, newEmoji, newDesc)
    refresh()
    setShowCreate(false)
    setNewName(""); setNewDesc(""); setNewEmoji("🎬"); setShowPresets(false)
  }

  const startEdit = (list: CustomList) => {
    setEditingId(list.id)
    setEditName(list.name)
    setEditEmoji(list.emoji)
    setEditDesc(list.description)
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    updateList(editingId, { name: editName.trim(), emoji: editEmoji, description: editDesc.trim() })
    refresh()
    setEditingId(null)
  }

  const handleDeleteList = (id: string) => {
    deleteList(id)
    refresh()
    setConfirmDeleteId(null)
    if (activeListId === id) setActiveListId(null)
  }

  const handleRemoveMovie = (listId: string, movieId: number) => {
    removeMovieFromList(listId, movieId)
    // Remove from cache? No — keep for UX
    refresh()
  }

  const applyPreset = (preset: (typeof LIST_PRESETS)[0]) => {
    setNewName(preset.name); setNewEmoji(preset.emoji); setNewDesc(preset.description)
    setShowPresets(false)
  }

  if (!mounted) return null

  // ── DETAIL VIEW ───────────────────────────────────────────────────────
  if (activeList) {
    const movies = activeList.movieIds
      .map((id) => movieCache[id])
      .filter((m): m is Movie => m !== null && m !== undefined)

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">

            {/* Back + header */}
            <button
              onClick={() => setActiveListId(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">All Lists</span>
            </button>

            <div className="flex items-start gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-4xl shadow-lg flex-shrink-0">
                {activeList.emoji}
              </div>
              <div className="flex-1 min-w-0">
                {editingId === activeList.id ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {EMOJI_OPTIONS.map((e) => (
                        <button key={e} onClick={() => setEditEmoji(e)}
                          className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all ${editEmoji === e ? "bg-primary/30 ring-2 ring-primary scale-110" : "hover:bg-secondary"}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={40}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={80}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={!editName.trim()}><Check className="h-4 w-4 mr-1" />Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-foreground">{activeList.name}</h1>
                    {activeList.description && <p className="text-muted-foreground mt-1">{activeList.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeList.movieIds.length} {activeList.movieIds.length === 1 ? "movie" : "movies"} • Created {formatDate(activeList.createdAt)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => startEdit(activeList)}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeleteId(activeList.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete List
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Delete confirm */}
            {confirmDeleteId === activeList.id && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-4">
                <p className="text-sm text-foreground flex-1">
                  Delete <strong>{activeList.name}</strong>? This cannot be undone.
                </p>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteList(activeList.id)}>Delete</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              </div>
            )}

            {/* Loading movies */}
            {loadingMovies && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}

            {/* Empty */}
            {!loadingMovies && activeList.movieIds.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-6xl mb-4">{activeList.emoji}</span>
                <h2 className="text-xl font-semibold text-foreground mb-2">This list is empty</h2>
                <p className="text-muted-foreground text-sm mb-6">Browse movies and use the <strong>Add to List</strong> button to fill it up.</p>
                <Button onClick={() => router.push("/home")}>Browse Movies</Button>
              </div>
            )}

            {/* Movie grid */}
            {movies.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {activeList.movieIds.map((movieId) => {
                  const movie = movieCache[movieId]
                  if (!movie) return null
                  return (
                    <div key={movieId} className="group relative">
                      <div
                        className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer bg-secondary transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20"
                        onClick={() => { setSelectedMovie(movie); setShowModal(true) }}
                      >
                        <Image
                          src={movie.poster || "/placeholder.svg?height=300&width=200"}
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Remove button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveMovie(activeList.id, movieId) }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                          title="Remove from list"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>

                        {/* Rating */}
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-amber-400 text-xs font-bold px-2 py-1 rounded-md">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {movie.rating}
                        </div>

                        {/* Title on hover */}
                        <div className="absolute bottom-0 inset-x-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-semibold truncate">{movie.title}</p>
                          <p className="text-white/60 text-xs">{movie.year}</p>
                        </div>
                      </div>

                      {/* Title below */}
                      <p className="mt-2 text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {movie.title}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
      </div>
    )
  }

  // ── ALL LISTS VIEW ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">

          {/* Page header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-1">My Lists</h1>
              <p className="text-muted-foreground">
                Curate your personal collections — Weekend Watch, Date Night & more.
              </p>
            </div>
            <Button
              onClick={() => { setShowCreate(true); setShowPresets(false) }}
              className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
              id="create-list-btn"
            >
              <Plus className="h-4 w-4" />
              New List
            </Button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="mb-8 p-6 rounded-2xl bg-card border border-border shadow-xl shadow-black/10 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Create a New List</h2>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Template suggestions */}
              <div>
                <button onClick={() => setShowPresets((s) => !s)}
                  className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                  ✨ {showPresets ? "Hide templates" : "Start from a template"}
                </button>
                {showPresets && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {LIST_PRESETS.map((p) => (
                      <button key={p.name} onClick={() => applyPreset(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
                        <span>{p.emoji}</span> {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Emoji picker */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Icon</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} onClick={() => setNewEmoji(e)}
                      className={`w-9 h-9 text-xl rounded-xl flex items-center justify-center transition-all ${newEmoji === e ? "bg-primary/30 ring-2 ring-primary scale-110" : "bg-secondary hover:bg-secondary/80"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block uppercase tracking-wide">List Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekend Watch"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={40}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block uppercase tracking-wide">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Perfect picks for Saturday night"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    maxLength={80}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCreate} disabled={!newName.trim()} id="save-list-btn"
                  className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                  <Check className="mr-2 h-4 w-4" />Create List
                </Button>
                <Button variant="ghost" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); setNewEmoji("🎬") }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {lists.length === 0 && !showCreate && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-xl">
                <ListMusic className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No lists yet</h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Create lists like <strong className="text-foreground">Weekend Watch</strong>, <strong className="text-foreground">Date Night</strong>, or <strong className="text-foreground">Must Watch</strong> to organise your movies.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {LIST_PRESETS.slice(0, 4).map((p) => (
                  <button key={p.name}
                    onClick={() => { setShowCreate(true); applyPreset(p) }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-medium text-foreground shadow-sm">
                    <span className="text-xl">{p.emoji}</span> {p.name}
                  </button>
                ))}
              </div>
              <Button onClick={() => setShowCreate(true)} size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                <Plus className="mr-2 h-5 w-5" />Create Your First List
              </Button>
            </div>
          )}

          {/* Lists grid */}
          {lists.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {lists.map((list) => (
                <div key={list.id}
                  className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300">

                  {/* Color band top */}
                  <div className="h-1.5 bg-gradient-to-r from-primary to-purple-600" />

                  {/* Inline edit form */}
                  {editingId === list.id ? (
                    <div className="p-5 space-y-3">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {EMOJI_OPTIONS.map((e) => (
                          <button key={e} onClick={() => setEditEmoji(e)}
                            className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all ${editEmoji === e ? "bg-primary/30 ring-2 ring-primary scale-110" : "hover:bg-secondary"}`}>
                            {e}
                          </button>
                        ))}
                      </div>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={40}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                      <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={80}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} disabled={!editName.trim()}>
                          <Check className="h-3.5 w-3.5 mr-1" />Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5 mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Card body */}
                      <div
                        className="p-5 cursor-pointer"
                        onClick={() => setActiveListId(list.id)}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-4xl leading-none">{list.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground truncate text-lg group-hover:text-primary transition-colors">
                              {list.name}
                            </h3>
                            {list.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{list.description}</p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary/50" />
                            {list.movieIds.length} {list.movieIds.length === 1 ? "movie" : "movies"}
                          </span>
                          <span>{formatDate(list.createdAt)}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="px-5 pb-4 flex items-center gap-2 border-t border-border/50 pt-3">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(list)}>
                          <Pencil className="h-3 w-3 mr-1" />Edit
                        </Button>
                        {confirmDeleteId === list.id ? (
                          <>
                            <span className="text-xs text-muted-foreground flex-1">Sure?</span>
                            <Button size="sm" variant="destructive" className="h-7 px-2 text-xs"
                              onClick={() => handleDeleteList(list.id)}>Yes, Delete</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                              onClick={() => setConfirmDeleteId(null)}>No</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive ml-auto"
                            onClick={() => setConfirmDeleteId(list.id)}>
                            <Trash2 className="h-3 w-3 mr-1" />Delete
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add new list card */}
              <button
                onClick={() => { setShowCreate(true); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                className="flex flex-col items-center justify-center gap-3 bg-card border-2 border-dashed border-border rounded-2xl p-8 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 min-h-[160px] group"
              >
                <div className="w-12 h-12 rounded-full bg-secondary group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Create New List</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
