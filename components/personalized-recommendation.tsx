"use client"

import { useEffect, useState, useCallback, Fragment } from "react"
import { MovieCarousel } from "./movie-carousel"
import { fetchPersonalizedRecommendationsData, type ScopedRecommendation } from "@/lib/movie-data"
import { getPreferences } from "@/lib/preferences"
import { Sparkles, Loader2, Star, User } from "lucide-react"

interface PersonalizedRecommendationProps {
  onMovieClick: (movie: any) => void
}

export function PersonalizedRecommendation({ onMovieClick }: PersonalizedRecommendationProps) {
  const [recommendationSets, setRecommendationSets] = useState<ScopedRecommendation[]>([])
  const [firstName, setFirstName] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const loadRecommendations = useCallback(async () => {
    const prefs = getPreferences()
    if (!prefs) return

    setFirstName(prefs.firstName || "there")

    try {
      setLoading(true)
      const recs = await fetchPersonalizedRecommendationsData(prefs)
      if (recs && recs.length > 0) {
        setRecommendationSets(recs)
      }
    } catch (err) {
      console.error("Personalized recommendation failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    loadRecommendations()
  }, [loadRecommendations])

  if (!mounted) return null

  // Show loading BEFORE checking for data — otherwise it returns null during fetch
  if (loading) {
    return (
      <div className="py-8 px-4 flex items-center gap-4">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-muted-foreground italic">Fetching movies based on your taste...</p>
      </div>
    )
  }

  // No results — render nothing
  if (recommendationSets.length === 0) return null

  return (
    <div className="space-y-8 py-4">
      {recommendationSets.map((recSet, index) => (
        <div key={index} className="relative group/personalized">
          <div className="flex items-center gap-2 px-4 mb-2">
            <div className="bg-amber-500/20 p-1.5 rounded-md">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">For {firstName}</span>
          </div>
          <MovieCarousel
            categoryId={recSet.categoryId || ""}
            title={recSet.title}
            movies={recSet.movies}
            onMovieClick={onMovieClick}
          />
        </div>
      ))}
    </div>
  )
}
