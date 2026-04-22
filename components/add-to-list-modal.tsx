"use client"

import { useEffect, useState } from "react"
import { Plus, Check, ListPlus, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  getAllLists,
  createList,
  addMovieToList,
  removeMovieFromList,
  isMovieInList,
  LIST_PRESETS,
  type CustomList,
} from "@/lib/custom-lists"

interface AddToListModalProps {
  movieId: number
  movieTitle: string
  open: boolean
  onClose: () => void
}

const EMOJI_OPTIONS = ["🎬", "🍿", "❤️", "😂", "😱", "🚀", "🧠", "🎉", "💑", "👨‍👩‍👧‍👦", "🔥", "✨", "🏆", "🌙", "🎭", "🌊"]

export function AddToListModal({ movieId, movieTitle, open, onClose }: AddToListModalProps) {
  const [lists, setLists] = useState<CustomList[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmoji, setNewEmoji] = useState("🎬")
  const [newDesc, setNewDesc] = useState("")
  const [showPresets, setShowPresets] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLists(getAllLists())
      setCreating(false)
      setNewName("")
      setNewEmoji("🎬")
      setNewDesc("")
      setShowPresets(false)
      setFeedback(null)
    }
  }, [open])

  const refresh = () => setLists(getAllLists())

  const handleToggle = (listId: string) => {
    if (isMovieInList(listId, movieId)) {
      removeMovieFromList(listId, movieId)
      showFeedback("Removed from list")
    } else {
      addMovieToList(listId, movieId)
      showFeedback("Added to list ✓")
    }
    refresh()
  }

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 1800)
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    const list = createList(newName, newEmoji, newDesc)
    addMovieToList(list.id, movieId)
    refresh()
    setCreating(false)
    setNewName("")
    setNewDesc("")
    setNewEmoji("🎬")
    showFeedback(`"${list.name}" created & movie added ✓`)
  }

  const applyPreset = (preset: (typeof LIST_PRESETS)[0]) => {
    setNewName(preset.name)
    setNewEmoji(preset.emoji)
    setNewDesc(preset.description)
    setShowPresets(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md p-0 bg-card border-border overflow-hidden"
        aria-describedby="add-to-list-desc"
      >
        <DialogTitle className="sr-only">Add to Custom List</DialogTitle>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-primary/10 to-purple-500/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <ListPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Add to List</h2>
              <p id="add-to-list-desc" className="text-xs text-muted-foreground truncate max-w-[240px]">
                {movieTitle}
              </p>
            </div>
          </div>

          {/* Feedback toast */}
          {feedback && (
            <div className="mt-3 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-lg text-xs text-primary font-medium text-center animate-in fade-in slide-in-from-bottom-2">
              {feedback}
            </div>
          )}
        </div>

        {/* List of existing custom lists */}
        <div className="max-h-[280px] overflow-y-auto">
          {lists.length === 0 && !creating && (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-muted-foreground text-sm">No custom lists yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Create your first list below!</p>
            </div>
          )}

          {lists.map((list) => {
            const inList = isMovieInList(list.id, movieId)
            return (
              <button
                key={list.id}
                onClick={() => handleToggle(list.id)}
                className={`w-full flex items-center gap-3 px-6 py-3.5 hover:bg-secondary/60 transition-colors text-left border-b border-border/50 last:border-0 ${
                  inList ? "bg-primary/5" : ""
                }`}
              >
                <span className="text-2xl leading-none">{list.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{list.name}</p>
                  {list.description && (
                    <p className="text-xs text-muted-foreground truncate">{list.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {list.movieIds.length} {list.movieIds.length === 1 ? "movie" : "movies"}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    inList
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "border-2 border-border"
                  }`}
                >
                  {inList && <Check className="h-3.5 w-3.5" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Create new list panel */}
        {creating ? (
          <div className="px-6 py-4 border-t border-border bg-secondary/30 space-y-3">
            {/* Preset suggestions */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New List</p>
              <button
                onClick={() => setShowPresets((s) => !s)}
                className="text-xs text-primary hover:underline"
              >
                {showPresets ? "Hide suggestions" : "Use a template ✨"}
              </button>
            </div>

            {showPresets && (
              <div className="flex flex-wrap gap-1.5">
                {LIST_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            )}

            {/* Emoji picker */}
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all ${
                    newEmoji === e
                      ? "bg-primary/30 ring-2 ring-primary scale-110"
                      : "hover:bg-secondary"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="List name (e.g. Weekend Watch)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={40}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              maxLength={80}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()} className="flex-1">
                Create & Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreating(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
              onClick={() => setCreating(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New List
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
