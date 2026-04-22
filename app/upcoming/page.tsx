"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MovieCard } from "@/components/movie-card"
import { MovieModal } from "@/components/movie-modal"
import { isAuthenticated } from "@/lib/auth"
import { fetchUpcomingMoviesData, type UpcomingMovie, type Movie } from "@/lib/movie-data"
import { CalendarDays, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UpcomingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [movies, setMovies] = useState<UpcomingMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Filters
  const [filterPeriod, setFilterPeriod] = useState<"1M" | "3M" | "6M" | "1Y">("1Y")

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)
    
    async function loadData() {
      try {
        setLoading(true)
        const data = await fetchUpcomingMoviesData(8) // Grab ~160 upcoming blockbusters
        setMovies(data)
      } catch {
        setMovies([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  // Filter the movies dynamically based on exact release dates
  const filteredMovies = useMemo(() => {
    if (movies.length === 0) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const cutoffDate = new Date()
    if (filterPeriod === "1M") cutoffDate.setMonth(today.getMonth() + 1)
    if (filterPeriod === "3M") cutoffDate.setMonth(today.getMonth() + 3)
    if (filterPeriod === "6M") cutoffDate.setMonth(today.getMonth() + 6)
    if (filterPeriod === "1Y") cutoffDate.setFullYear(today.getFullYear() + 1)

    return movies.filter(m => {
      const rd = new Date(m.releaseDate)
      return rd <= cutoffDate
    })
  }, [movies, filterPeriod])

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowModal(true)
  }

  // Helper to format date wonderfully
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateStr).toLocaleDateString('en-US', options)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          
          <Button 
            variant="ghost" 
            className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/settings")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Upcoming Releases</h1>
                <p className="text-muted-foreground mt-1">Highly anticipated movies coming soon to theaters</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 p-1 bg-secondary rounded-xl">
              {[
                { id: "1M", label: "1 Month" },
                { id: "3M", label: "3 Months" },
                { id: "6M", label: "6 Months" },
                { id: "1Y", label: "1 Year" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterPeriod(f.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterPeriod === f.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-32">
               <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
               <p className="text-lg text-muted-foreground font-medium">Scanning future timelines...</p>
             </div>
          ) : filteredMovies.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32 bg-secondary/30 rounded-2xl border border-border dashed">
               <CalendarDays className="h-16 w-16 text-muted-foreground/50 mb-4" />
               <h3 className="text-xl font-bold text-foreground mb-2">No upcoming movies found</h3>
               <p className="text-muted-foreground text-center max-w-md">
                 There are no blockbuster movies scheduled in this exact timeframe. Try expanding your filter to 1 Year.
               </p>
             </div>
          ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-4">
               {filteredMovies.map((movie) => (
                 <div key={movie.id} className="relative group flex flex-col">
                   <MovieCard movie={movie as Movie} onPlay={handleMovieClick} />
                   
                   {/* Explicit Release Date UI floating under the card */}
                   <div className="mt-3 flex flex-col items-center px-1">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-secondary rounded-md text-secondary-foreground border border-border w-full text-center truncate shadow-sm">
                        📅 {formatDate(movie.releaseDate)}
                      </span>
                   </div>
                 </div>
               ))}
             </div>
          )}

        </div>
      </main>
      
      {/* Shared robust video playing modal */}
      <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
