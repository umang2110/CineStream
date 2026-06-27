"use client"

import { useEffect, useState, useCallback, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MovieCard } from "@/components/movie-card"
import { MovieModal } from "@/components/movie-modal"
import { isAuthenticated } from "@/lib/auth"
import { searchMoviesGlobal, type Movie } from "@/lib/movie-data"
import { Search, Loader2, Film } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12 px-4 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </main>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageContent() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [allMovies, setAllMovies] = useState<Movie[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchInput, setSearchInput] = useState(query)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)
  }, [router])

  // Search when query changes
  useEffect(() => {
    if (!query) return

    async function doSearch() {
      try {
        setLoading(true)
        setCurrentPage(1)
        setHasMore(true)
        const results = await searchMoviesGlobal(query)
        setAllMovies(results)
        setMovies(results.slice(0, 20))
        if (results.length <= 20) setHasMore(false)
      } catch {
        setAllMovies([])
        setMovies([])
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    doSearch()
    setSearchInput(query)
  }, [query])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !query) return
    try {
      setLoadingMore(true)
      // Small simulated delay for UX smoothness
      await new Promise(r => setTimeout(r, 600))
      
      const nextPage = currentPage + 1
      const amount = nextPage * 20
      setMovies(allMovies.slice(0, amount))
      setCurrentPage(nextPage)
      if (amount >= allMovies.length) {
        setHasMore(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [currentPage, query, loadingMore, hasMore, allMovies])

  // Setup Intersection Observer for infinite scrolling
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    if (!hasMore || loadingMore || !query) return

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
  }, [hasMore, loadingMore, query, loadMore])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowModal(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for any movie — Hollywood, Bollywood, South, Korean..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-xl text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                autoFocus
              />
            </div>
          </form>

          {/* Results */}
          {query && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Search results for "{query}"
              </h1>
              {!loading && (
                <p className="text-muted-foreground">
                  {movies.length} {movies.length === 1 ? "movie" : "movies"} found
                </p>
              )}
            </div>
          )}

          {!query && (
            <div className="flex flex-col items-center justify-center py-20">
              <Film className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Search for movies</h2>
              <p className="text-muted-foreground">
                Find any movie — Hollywood, Bollywood, Tamil, Telugu, Korean, and more
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground">Searching for "{query}"...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onPlay={handleMovieClick} />
                ))}
              </div>

              {query && movies.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-semibold text-foreground mb-2">No movies found</h2>
                  <p className="text-muted-foreground">Try a different search term</p>
                </div>
              )}

              {hasMore && movies.length > 0 && (
                <div ref={loaderRef} className="flex justify-center mt-10 py-6">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading more results...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

