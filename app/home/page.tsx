"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { HeroBanner } from "@/components/hero-banner"
import { MovieCarousel } from "@/components/movie-carousel"
import { MovieModal } from "@/components/movie-modal"
import { AIRecommendation } from "@/components/ai-recommendation"
import { isAuthenticated } from "@/lib/auth"
import { fetchInitialCategories, fetchSecondaryCategories, type Movie, type Category } from "@/lib/movie-data"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [loadingSecondary, setLoadingSecondary] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)

  const loadMoreRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || loadingSecondary || !hasMore) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadSecondaryCategories()
          }
        },
        { rootMargin: "200px" }
      )

      if (node) observer.current.observe(node)
    },
    [loading, loadingSecondary, hasMore]
  )

  const loadSecondaryCategories = async () => {
    try {
      setLoadingSecondary(true)
      const secondaryCats = await fetchSecondaryCategories()
      setCategories((prev) => [...prev, ...secondaryCats])
      setHasMore(false)
    } catch (err) {
      console.error("Failed to load secondary categories:", err)
    } finally {
      setLoadingSecondary(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)

    async function loadMovies() {
      try {
        setLoading(true)
        const initialCats = await fetchInitialCategories()
        setCategories(initialCats)
        // Use a random trending movie for the hero banner
        if (initialCats.length > 0 && initialCats[0].movies.length > 0) {
          const trending = initialCats[0].movies
          setHeroMovie(trending[Math.floor(Math.random() * Math.min(5, trending.length))])
        }
        setLoading(false)
      } catch (err) {
        console.error("Failed to load movies:", err)
        setError("Failed to load movies. Please check your API key and try again.")
        setLoading(false)
      }
    }

    loadMovies()
  }, [router])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowModal(true)
  }

  const handlePlay = (movie: Movie) => {
    alert(`Playing: ${movie.title}`)
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          {/* Skeleton Hero Banner */}
          <div className="relative h-[70vh] w-full overflow-hidden bg-secondary/20">
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="container mx-auto max-w-2xl space-y-4">
                <Skeleton className="h-12 w-3/4 bg-primary/20" />
                <Skeleton className="h-6 w-1/4 bg-primary/10" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full bg-primary/10" />
                  <Skeleton className="h-6 w-16 rounded-full bg-primary/10" />
                  <Skeleton className="h-6 w-16 rounded-full bg-primary/10" />
                </div>
                <Skeleton className="h-20 w-full bg-primary/10" />
                <div className="flex gap-3 pt-4">
                  <Skeleton className="h-12 w-36 bg-primary/20 rounded-md" />
                  <Skeleton className="h-12 w-32 bg-primary/10 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton Carousel */}
          <div className="space-y-8 py-8 container mx-auto px-4 md:px-12">
            <Skeleton className="h-8 w-48 mb-4 bg-primary/10" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[300px] min-w-[200px] w-[200px] rounded-lg bg-primary/10 flex-shrink-0" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="bg-card border border-destructive/50 rounded-lg p-8 max-w-md text-center">
            <p className="text-destructive text-lg font-medium mb-2">Error</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {heroMovie && (
          <HeroBanner movie={heroMovie} onPlay={handlePlay} onInfo={handleMovieClick} />
        )}
        <div className="space-y-8 py-8">
          <AIRecommendation onMovieClick={handleMovieClick} />
          {categories.map((category) => (
            <MovieCarousel
              key={category.id || category.name}
              categoryId={category.id}
              title={category.name}
              movies={category.movies}
              isTop10={category.isTop10}
              onMovieClick={handleMovieClick}
            />
          ))}

          {/* Scroll observer target and Loading more spinner */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mr-3" />
              <p className="text-muted-foreground text-lg">Loading more categories...</p>
            </div>
          )}
        </div>
      </main>

      <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
