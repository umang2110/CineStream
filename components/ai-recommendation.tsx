"use client"

import { useEffect, useState, useCallback } from "react"
import { MovieCarousel } from "./movie-carousel"
import { getLatestWatchedId } from "@/lib/history"
import { fetchMovieRecommendationsData, fetchMovieByIdData, type Movie } from "@/lib/movie-data"
import { Sparkles, Loader2 } from "lucide-react"

interface AIRecommendationProps {
  onMovieClick: (movie: Movie) => void
}

export function AIRecommendation({ onMovieClick }: AIRecommendationProps) {
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [baseMovie, setBaseMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const loadAIData = useCallback(async () => {
    const latestId = getLatestWatchedId()
    if (!latestId) return

    // Don't re-fetch if already showing recs for this movie
    if (baseMovie && baseMovie.id === latestId && recommendations.length > 0) return

    try {
      setLoading(true)
      const [movieDetails, recs] = await Promise.all([
        fetchMovieByIdData(latestId),
        fetchMovieRecommendationsData(latestId)
      ])

      if (movieDetails) {
        setBaseMovie(movieDetails)
      }

      if (recs && recs.length > 0) {
        setRecommendations(recs)
      }
    } catch (err) {
      console.error("AI Recommendation failed:", err)
    } finally {
      setLoading(false)
    }
  }, [baseMovie, recommendations.length])

  useEffect(() => {
    setMounted(true)
    // Load on mount (in case history already exists)
    loadAIData()

    // Listen for history changes so we re-fetch after user watches a trailer
    const handleHistoryUpdate = () => {
      loadAIData()
    }
    window.addEventListener("watchHistoryUpdated", handleHistoryUpdate)
    return () => {
      window.removeEventListener("watchHistoryUpdated", handleHistoryUpdate)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null

  // Show loading BEFORE checking for data — otherwise it returns null during fetch
  if (loading) {
    return (
      <div className="py-8 px-4 flex items-center gap-4">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-muted-foreground italic">Generating smart recommendations...</p>
      </div>
    )
  }

  // No history or no results — render nothing
  if (!baseMovie || recommendations.length === 0) return null

  return (
    <div className="relative group/ai py-4 my-4">
      <div className="flex items-center gap-2 px-4 mb-2">
        <div className="bg-primary/20 p-1.5 rounded-md">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-semibold text-primary uppercase tracking-widest">AI Suggestion</span>
      </div>
      <MovieCarousel
        title={`Because you liked ${baseMovie.title}`}
        movies={recommendations}
        onMovieClick={onMovieClick}
      />
    </div>
  )
}
