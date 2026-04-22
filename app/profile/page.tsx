"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MovieCarousel } from "@/components/movie-carousel"
import { MovieModal } from "@/components/movie-modal"
import { PersonalizedRecommendation } from "@/components/personalized-recommendation"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import { getFavorites } from "@/lib/favorites"
import { getHistory } from "@/lib/history"
import { fetchMovieByIdData, type Movie } from "@/lib/movie-data"
import { Heart, Clock, Sparkles, Settings, ArrowRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([])
  const [historyMovies, setHistoryMovies] = useState<Movie[]>([])

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)
    setUser(getCurrentUser())

    const loadData = async () => {
      // Load top 15 favorites
      const favIds = getFavorites().slice(0, 15)
      if (favIds.length > 0) {
         const favPromises = favIds.map(id => fetchMovieByIdData(id))
         const favRecs = await Promise.all(favPromises)
         setFavoriteMovies(favRecs.filter((m): m is Movie => m !== null))
      }

      // Load top 15 history
      const histIds = getHistory().slice(0, 15)
      if (histIds.length > 0) {
         const histPromises = histIds.map(id => fetchMovieByIdData(id))
         const histRecs = await Promise.all(histPromises)
         setHistoryMovies(histRecs.filter((m): m is Movie => m !== null))
      }
    }
    
    loadData()
  }, [router])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowModal(true)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          
          {/* Header Profile Section */}
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                 <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="gap-2">
               <Link href="/settings">
                 <Settings className="h-4 w-4" />
                 Account Settings
               </Link>
            </Button>
          </div>

          {/* Section 1: My List */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                My List
              </h2>
              {/* Note: since /profile WAS the favorites page historically, and now it's a hub, 
                  ideally we don't have a separate favorites URL. We just show top ones. 
                  But giving a Browse option works if empty. */}
            </div>
            
            {favoriteMovies.length === 0 ? (
               <div className="bg-card border border-border rounded-xl p-8 text-center max-w-2xl mx-auto">
                 <p className="text-muted-foreground mb-4">You haven't favorited any movies yet. Start browsing to curate your ideal list!</p>
                 <Button asChild><Link href="/home">Browse Movies</Link></Button>
               </div>
            ) : (
               <MovieCarousel title={undefined} movies={favoriteMovies} onMovieClick={handleMovieClick} />
            )}
          </section>

          {/* Section 2: Watch History */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Watch History
              </h2>
              {historyMovies.length > 0 && (
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link href="/history">View All <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              )}
            </div>
            
            {historyMovies.length === 0 ? (
               <div className="bg-card border border-border rounded-xl p-8 text-center max-w-2xl mx-auto">
                 <p className="text-muted-foreground mb-4">You haven't watched any trailers yet.</p>
                 <Button asChild><Link href="/home">Discover Movies</Link></Button>
               </div>
            ) : (
               <MovieCarousel title={undefined} movies={historyMovies} onMovieClick={handleMovieClick} />
            )}
          </section>

          {/* Section 3: Recommendations */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-2 px-2 border-t border-border pt-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Personalized Recommendations
              </h2>
            </div>
            {/* Native recommendations block */}
            <div className="-mt-4">
              <PersonalizedRecommendation onMovieClick={handleMovieClick} />
            </div>
          </section>

          {/* Section 4: Movie Preferences */}
          <section className="mb-12">
            <div className="flex items-center mb-4 px-2 border-t border-border pt-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-500" />
                Movie Preferences
              </h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="max-w-2xl text-center md:text-left">
                  <h3 className="font-semibold text-lg text-foreground mb-2">CineStream Profiling</h3>
                  <p className="text-muted-foreground">
                    Update your favorite categories and actors to immediately refresh your Personalized Recommendations. You have complete control over what films our algorithm serves you.
                  </p>
               </div>
               <Button asChild size="lg" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                 <Link href="/preferences">Edit Preferences</Link>
               </Button>
            </div>
          </section>

        </div>
      </main>

      <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
