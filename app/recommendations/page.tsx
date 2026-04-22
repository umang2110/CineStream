"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MovieCard } from "@/components/movie-card"
import { MovieModal } from "@/components/movie-modal"
import { isAuthenticated } from "@/lib/auth"
import { getFavorites, updateGenrePreferences } from "@/lib/favorites"
import { getPreferences } from "@/lib/preferences"
import { PersonalizedRecommendation } from "@/components/personalized-recommendation"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { type Movie } from "@/lib/movie-data"

export default function RecommendationsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)
  }, [router])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowModal(true)
    updateGenrePreferences(movie.genre)
  }

  if (!mounted) return null

  const userPreferences = getPreferences()
  const hasPreferences = userPreferences && (
    (userPreferences.favoriteGenres && userPreferences.favoriteGenres.length > 0) || 
    (userPreferences.favoriteActors && userPreferences.favoriteActors.length > 0)
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Recommended for You</h1>
            </div>
            <p className="text-muted-foreground">
              {hasPreferences
                ? "Based on your movie preferences and favorite actors."
                : "Add categories and actors to get personalized suggestions."}
            </p>
          </div>

          {!hasPreferences && (
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-2">Personalize Your AI Suggestions</h2>
              <p className="text-muted-foreground mb-4">
                Update your movie preferences by selecting your favorite genres and actors to let the AI build your carousels!
              </p>
              <Button asChild variant="default">
                <Link href="/preferences">Set Preferences</Link>
              </Button>
            </div>
          )}

          {hasPreferences && (
             <PersonalizedRecommendation onMovieClick={handleMovieClick} />
          )}
        </div>
      </main>

      <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
