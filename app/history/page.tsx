"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MovieCard } from "@/components/movie-card"
import { MovieModal } from "@/components/movie-modal"
import { isAuthenticated } from "@/lib/auth"
import { getHistory, removeFromHistory } from "@/lib/history"
import { fetchMovieByIdData, type Movie } from "@/lib/movie-data"
import { Clock, Loader2, Trash2, History } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WatchHistoryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const historyIds = getHistory()

      if (historyIds.length === 0) {
        setMovies([])
        return
      }

      // Fetch movie details for each history entry
      const moviePromises = historyIds.map((id) => fetchMovieByIdData(id))
      const results = await Promise.all(moviePromises)
      const validMovies = results.filter((m): m is Movie => m !== null)
      setMovies(validMovies)
    } catch (err) {
      console.error("Failed to load watch history:", err)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)
    loadHistory()
  }, [router, loadHistory])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowModal(true)
  }

  const handleRemoveFromHistory = (movieId: number) => {
    removeFromHistory(movieId)
    setMovies((prev) => prev.filter((m) => m.id !== movieId))
  }

  const handleClearAll = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("watchHistory")
      setMovies([])
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">Watch History</h1>
                  <p className="text-muted-foreground mt-1">
                    {movies.length > 0
                      ? `${movies.length} movie${movies.length !== 1 ? "s" : ""} viewed`
                      : "Track which movies you've viewed"}
                  </p>
                </div>
              </div>
              {movies.length > 0 && (
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading your watch history...</p>
              </div>
            </div>
          ) : movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <History className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">No History Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start watching trailers to build your viewing history. Your watch history helps us give you better recommendations!
                </p>
                <Button onClick={() => router.push("/home")} className="gap-2">
                  Browse Movies
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Movie Grid with remove buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {movies.map((movie, index) => (
                  <div key={movie.id} className="relative group/item">
                    {/* Order badge */}
                    {index < 3 && (
                      <div className="absolute -top-2 -left-2 z-10 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg">
                        {index + 1}
                      </div>
                    )}
                    <MovieCard movie={movie} onPlay={handleMovieClick} />
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFromHistory(movie.id)
                      }}
                      className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-black/70 text-white opacity-0 group-hover/item:opacity-100 hover:bg-red-600 transition-all duration-200"
                      title="Remove from history"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
