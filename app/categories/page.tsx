"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MovieCard } from "@/components/movie-card"
import { MovieModal } from "@/components/movie-modal"
import { isAuthenticated } from "@/lib/auth"
import {
  fetchDiscoverMovies,
  type Movie,
} from "@/lib/movie-data"
import { Loader2, X, ArrowDownUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterItem {
  id: number | string
  name: string
  type: "genre" | "language"
}

const LANGUAGE_FILTERS: FilterItem[] = [
  { id: "hi", name: "🇮🇳 Bollywood", type: "language" },
  { id: "te", name: "🎥 Telugu", type: "language" },
  { id: "ta", name: "🎞️ Tamil", type: "language" },
  { id: "ml", name: "🌴 Malayalam", type: "language" },
  { id: "kn", name: "Kannada", type: "language" },
  { id: "en", name: "🇺🇸 Hollywood", type: "language" },
  { id: "ko", name: "🇰🇷 Korean", type: "language" },
  { id: "ja", name: "🇯🇵 Japanese", type: "language" },
  { id: "es", name: "🇪🇸 Spanish", type: "language" },
  { id: "fr", name: "🇫🇷 French", type: "language" },
]

const GENRE_FILTERS: FilterItem[] = [
  { id: 28, name: "💥 Action", type: "genre" },
  { id: 35, name: "😂 Comedy", type: "genre" },
  { id: 18, name: "🎭 Drama", type: "genre" },
  { id: 27, name: "👻 Horror", type: "genre" },
  { id: 10749, name: "💕 Romance", type: "genre" },
  { id: 878, name: "🚀 Sci-Fi", type: "genre" },
  { id: 53, name: "🔪 Thriller", type: "genre" },
  { id: 16, name: "✨ Animation", type: "genre" },
  { id: 14, name: "Fantasy", type: "genre" },
  { id: 99, name: "Documentary", type: "genre" },
  { id: 12, name: "Adventure", type: "genre" },
  { id: 9648, name: "Mystery", type: "genre" },
  { id: 10752, name: "War", type: "genre" },
  { id: 37, name: "Western", type: "genre" },
  { id: 80, name: "Crime", type: "genre" },
  { id: 10751, name: "Family", type: "genre" },
  { id: 36, name: "History", type: "genre" },
  { id: 10402, name: "Music", type: "genre" },
]

function filterKey(f: FilterItem): string {
  return `${f.type}-${f.id}`
}

export default function CategoriesPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<FilterItem[]>([])
  const [selectedGenres, setSelectedGenres] = useState<FilterItem[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState("popularity")
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)
  }, [router])

  const isLangSelected = (f: FilterItem) => selectedLanguages.some((s) => s.id === f.id)
  const isGenreSelected = (f: FilterItem) => selectedGenres.some((s) => s.id === f.id)

  const toggleLanguage = (filter: FilterItem) => {
    if (isLangSelected(filter)) {
      setSelectedLanguages((prev) => prev.filter((f) => f.id !== filter.id))
    } else {
      setSelectedLanguages((prev) => [...prev, filter])
    }
  }

  const toggleGenre = (filter: FilterItem) => {
    if (isGenreSelected(filter)) {
      setSelectedGenres((prev) => prev.filter((f) => f.id !== filter.id))
    } else {
      setSelectedGenres((prev) => [...prev, filter])
    }
  }

  const clearAll = () => {
    setSelectedLanguages([])
    setSelectedGenres([])
  }

  // Build a fetch function based on current filters
  const fetchPage = useCallback(
    async (page: number): Promise<Movie[]> => {
      const langs = selectedLanguages.map((f) => f.id as string)
      const genreIds = selectedGenres.map((f) => f.id as number)

      return fetchDiscoverMovies({
        langs,
        genres: genreIds,
        sortBy,
        page,
      })
    },
    [selectedLanguages, selectedGenres, sortBy]
  )

  // Fetch movies when filters change
  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true)
        setCurrentPage(1)
        setHasMore(true)
        const results = await fetchPage(1)
        setMovies(results)
        if (results.length < 15) setHasMore(false)
      } catch {
        setMovies([])
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated()) {
      loadMovies()
    }
  }, [selectedLanguages, selectedGenres, fetchPage])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1
      const moreMovies = await fetchPage(nextPage)

      if (moreMovies.length === 0) {
        setHasMore(false)
      } else {
        const existingIds = new Set(movies.map((m) => m.id))
        const newMovies = moreMovies.filter((m) => !existingIds.has(m.id))
        if (newMovies.length === 0) {
          setHasMore(false)
        } else {
          setMovies((prev) => [...prev, ...newMovies])
          setCurrentPage(nextPage)
          if (moreMovies.length < 15) setHasMore(false)
        }
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [currentPage, fetchPage, loadingMore, hasMore, movies])

  // Setup Intersection Observer for infinite scrolling
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    if (!hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: "200px" } // trigger slightly before it appears
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loadMore])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowModal(true)
  }

  if (!mounted) return null

  const totalFilters = selectedLanguages.length + selectedGenres.length
  const langNames = selectedLanguages.map((f) => f.name).join(" + ")
  const genreNames = selectedGenres.map((f) => f.name).join(" + ")
  const filterDesc = genreNames ? `${langNames} › ${genreNames}` : langNames

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-foreground">Categories</h1>
              {totalFilters > 1 && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground mt-2">
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ArrowDownUp className="h-4 w-4" />
                <span className="text-sm font-medium">Sort by:</span>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] bg-secondary border-border">
                  <SelectValue placeholder="Sort..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">🔥 Popularity</SelectItem>
                  <SelectItem value="rating">⭐ Rating</SelectItem>
                  <SelectItem value="year">📅 Release Year</SelectItem>
                  <SelectItem value="az">🔤 Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-muted-foreground mb-1">
            {movies.length} movies
            {selectedLanguages.length > 0 && selectedGenres.length > 0
              ? ""
              : selectedGenres.length > 0
              ? " from all languages"
              : selectedLanguages.length === 0 && selectedGenres.length === 0
              ? " — showing popular worldwide"
              : ""}
          </p>
          <p className="text-xs text-muted-foreground/70 mb-5">
            💡 Pick a genre to see movies from all languages, or pick a language to narrow down
          </p>

          {/* Active filter summary */}
          {totalFilters > 1 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {selectedLanguages.map((f) => (
                <span
                  key={filterKey(f)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/15 text-blue-400 text-sm rounded-full font-medium border border-blue-500/20"
                >
                  {f.name}
                  {selectedLanguages.length > 1 && (
                    <button onClick={() => toggleLanguage(f)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {selectedGenres.length > 0 && (
                <span className="text-muted-foreground text-sm">+</span>
              )}
              {selectedGenres.map((f) => (
                <span
                  key={filterKey(f)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/15 text-emerald-400 text-sm rounded-full font-medium border border-emerald-500/20"
                >
                  {f.name}
                  <button onClick={() => toggleGenre(f)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Language filters */}
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Language / Region <span className="text-muted-foreground/50">(select one or more)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_FILTERS.map((filter) => (
                <button
                  key={filterKey(filter)}
                  onClick={() => toggleLanguage(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isLangSelected(filter)
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {/* Genre filters */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Genre <span className="text-muted-foreground/50">(optional — narrows results)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {GENRE_FILTERS.map((filter) => (
                <button
                  key={filterKey(filter)}
                  onClick={() => toggleGenre(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isGenreSelected(filter)
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading movies...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onPlay={handleMovieClick} />
                ))}
              </div>

              {movies.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-xl font-semibold text-foreground mb-2">No movies found</p>
                  <p className="text-muted-foreground">Try a different combination of filters</p>
                </div>
              )}

              {hasMore && movies.length > 0 && (
                <div ref={loaderRef} className="flex justify-center mt-10 py-6">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading more movies...</span>
                    </div>
                  )}
                </div>
              )}

              {!hasMore && movies.length > 0 && (
                <p className="text-center text-muted-foreground mt-8">
                  Showing all {movies.length} movies
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
