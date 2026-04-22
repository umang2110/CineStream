"use client"

import { useEffect, useState, useCallback, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MovieCard } from "@/components/movie-card"
import { MovieModal } from "@/components/movie-modal"
import { isAuthenticated } from "@/lib/auth"
import { fetchMoviesByCategoryId, getCategoryNameById, type Movie } from "@/lib/movie-data"
import { Loader2, ArrowLeft, Film } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CategoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [mounted, setMounted] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  
  const categoryName = getCategoryNameById(id)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)
    
    async function loadInitial() {
      try {
        setLoading(true)
        setCurrentPage(1)
        const initialMovies = await fetchMoviesByCategoryId(id, 1)
        setMovies(initialMovies)
        if (initialMovies.length < 20) setHasMore(false)
      } catch {
        setMovies([])
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }
    
    loadInitial()
  }, [router, id])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1
      const moreMovies = await fetchMoviesByCategoryId(id, nextPage)
      
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
          if (moreMovies.length < 20) setHasMore(false)
        }
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [currentPage, loadingMore, hasMore, movies, id])

  // Setup Intersection Observer for infinite scrolling
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!hasMore || loadingMore || !mounted) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    )

    if (loaderRef.current) observer.observe(loaderRef.current)
    observerRef.current = observer

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [hasMore, loadingMore, loadMore, mounted])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowModal(true)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-4 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                 <Film className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{categoryName}</h1>
                <p className="text-muted-foreground mt-1 tracking-wide">Endless catalog exploring {categoryName}</p>
              </div>
            </div>
            {!loading && (
               <p className="mt-4 md:mt-0 text-sm font-medium text-muted-foreground bg-secondary px-4 py-2 rounded-lg">
                 {movies.length} Movies Loaded
               </p>
            )}
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-32">
               <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
               <p className="text-lg text-muted-foreground font-medium">Loading {categoryName}...</p>
             </div>
          ) : movies.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32">
               <p className="text-xl font-bold text-foreground mb-2">No movies found in this list</p>
             </div>
          ) : (
             <>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {movies.map((movie) => (
                   <MovieCard key={movie.id} movie={movie} onPlay={handleMovieClick} />
                 ))}
               </div>
               
               {hasMore && (
                 <div ref={loaderRef} className="flex justify-center mt-12 py-6">
                   {loadingMore ? (
                     <div className="flex items-center gap-2 text-primary font-medium bg-secondary px-6 py-3 rounded-full">
                       <Loader2 className="h-5 w-5 animate-spin" />
                       <span>Loading more...</span>
                     </div>
                   ) : (
                     <div className="h-10" /> 
                   )}
                 </div>
               )}
               
               {!hasMore && movies.length > 0 && (
                 <div className="mt-12 text-center pb-8 border-t border-border/50 pt-8">
                   <p className="text-muted-foreground font-medium flex items-center justify-center gap-2">
                     <span className="w-12 h-[1px] bg-border block" />
                     You reached the end of {categoryName}
                     <span className="w-12 h-[1px] bg-border block" />
                   </p>
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
