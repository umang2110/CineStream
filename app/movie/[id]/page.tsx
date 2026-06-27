"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { MovieCard } from "@/components/movie-card"
import { MovieModal } from "@/components/movie-modal"
import { TrailerModal } from "@/components/trailer-modal"
import { isAuthenticated } from "@/lib/auth"
import { addToFavorites, removeFromFavorites, isFavorite, updateGenrePreferences } from "@/lib/favorites"
import { toMovie, type Movie } from "@/lib/movie-data"
import {
  fetchMovieDetails,
  fetchMovieCredits,
  fetchSimilarMovies,
  getGenreMap,
  posterUrl,
  backdropUrl,
  type TMDBMovieFull,
  type TMDBCast,
  type TMDBCrew,
} from "@/lib/tmdb"
import {
  Play, Heart, Star, Calendar, Clock, DollarSign,
  Globe, Building2, ArrowLeft, Loader2, User, ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"

function formatMoney(n: number): string {
  if (!n) return "N/A"
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function formatRuntime(min: number): string {
  if (!min) return "N/A"
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function MovieDetailsPage() {
    const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const params = useParams()
  const movieId = Number(params.id)

  const [details, setDetails] = useState<TMDBMovieFull | null>(null)
  const [cast, setCast] = useState<TMDBCast[]>([])
  const [crew, setCrew] = useState<TMDBCrew[]>([])
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [favorite, setFavorite] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)

    async function loadMovie() {
      setLoading(true)
      try {
        const [movieData, credits, similar, genreMap] = await Promise.all([
          fetchMovieDetails(movieId),
          fetchMovieCredits(movieId),
          fetchSimilarMovies(movieId),
          getGenreMap(),
        ])
        setDetails(movieData)
        setCast(credits.cast?.slice(0, 20) || [])
        setCrew(credits.crew || [])
        setSimilarMovies(similar.results.slice(0, 10).map((m) => toMovie(m, genreMap)))
        setFavorite(isFavorite(movieId))
      } catch (err) {
        console.error("Failed to load movie:", err)
      } finally {
        setLoading(false)
      }
    }

    loadMovie()
    window.scrollTo(0, 0)
  }, [movieId, router])

  const handleFavoriteToggle = () => {
    if (favorite) {
      removeFromFavorites(movieId)
      setFavorite(false)
    } else {
      addToFavorites(movieId)
      if (details?.genres) {
        updateGenrePreferences(details.genres.map((g) => g.name))
      }
      setFavorite(true)
    }
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-lg">Loading movie details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-muted-foreground text-lg">Movie not found</p>
        </div>
      </div>
    )
  }

  const director = crew.find((c) => c.job === "Director")
  const writers = crew.filter((c) => c.department === "Writing").slice(0, 3)
  const producers = crew.filter((c) => c.job === "Producer").slice(0, 3)
  const releaseYear = details.release_date ? new Date(details.release_date).getFullYear() : "N/A"

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Backdrop */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <Image
          src={backdropUrl(details.backdrop_path)}
          alt={details.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-20 left-6 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Play trailer button */}
        <button
          onClick={() => setTrailerOpen(true)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 group"
        >
          <div className="w-20 h-20 rounded-full bg-red-600/90 flex items-center justify-center shadow-2xl shadow-red-600/30 group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
            <Play className="h-9 w-9 text-white ml-1 fill-white" />
          </div>
        </button>
      </div>

      {/* Content */}
      <main className="container mx-auto max-w-7xl px-4 -mt-32 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0">
            <div className="w-[200px] md:w-[250px] rounded-xl overflow-hidden shadow-2xl border border-border/30">
              <Image
                src={posterUrl(details.poster_path)}
                alt={details.title}
                width={250}
                height={375}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Title & Tagline */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">{details.title}</h1>
            {details.tagline && (
              <p className="text-lg text-muted-foreground italic mb-4">"{details.tagline}"</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold text-lg">
                <Star className="h-5 w-5 fill-amber-400" />
                {details.vote_average.toFixed(1)} / 10
              </span>
              <span className="text-muted-foreground text-sm">
                ({details.vote_count.toLocaleString()} votes)
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {releaseYear}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatRuntime(details.runtime)}
              </span>
              {details.status && (
                <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs rounded-full font-medium">
                  {details.status}
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {details.genres.map((g) => (
                <span key={g.id} className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm font-medium border border-primary/20">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button size="lg" className="bg-red-600 text-white hover:bg-red-700" onClick={() => setTrailerOpen(true)}>
                <Play className="mr-2 h-5 w-5 fill-white" />
                Watch Trailer
              </Button>
              <Button size="lg" variant="outline" onClick={handleFavoriteToggle}>
                <Heart className={`mr-2 h-5 w-5 ${favorite ? "fill-red-500 text-red-500" : ""}`} />
                {favorite ? "In My List" : "Add to List"}
              </Button>
              {details.imdb_id && (
                <Button size="lg" variant="outline" asChild>
                  <a href={`https://www.imdb.com/title/${details.imdb_id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    IMDb
                  </a>
                </Button>
              )}
            </div>

            {/* Overview */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">Overview</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">{details.overview}</p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {director && (
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Director</p>
                  <p className="text-sm font-semibold text-foreground">{director.name}</p>
                </div>
              )}
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Budget</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatMoney(details.budget)}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Revenue</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatMoney(details.revenue)}
                </p>
              </div>
              {details.spoken_languages?.length > 0 && (
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Languages</p>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {details.spoken_languages.map((l) => l.english_name).join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* Production companies */}
            {details.production_companies?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Production
                </h2>
                <div className="flex flex-wrap gap-3">
                  {details.production_companies.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                      {c.logo_path ? (
                        <img src={posterUrl(c.logo_path, "w92")} alt="" className="h-6 w-auto object-contain brightness-0 invert opacity-70" />
                      ) : null}
                      <span className="text-sm text-muted-foreground">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Writers & Producers */}
            {(writers.length > 0 || producers.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {writers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Writers</h3>
                    <div className="flex flex-wrap gap-2">
                      {writers.map((w) => (
                        <span key={`${w.id}-${w.job}`} className="text-sm text-foreground bg-secondary/50 px-3 py-1 rounded-lg">
                          {w.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {producers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Producers</h3>
                    <div className="flex flex-wrap gap-2">
                      {producers.map((p) => (
                        <span key={`${p.id}-${p.job}`} className="text-sm text-foreground bg-secondary/50 px-3 py-1 rounded-lg">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cast Section */}
        {cast.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
              {cast.map((actor) => (
                <Link key={actor.id} href={`/person/${actor.id}`} className="shrink-0 w-[130px] group cursor-pointer">
                  <div className="w-[130px] h-[180px] rounded-xl overflow-hidden bg-secondary mb-2 relative ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                    {actor.profile_path ? (
                      <img
                        src={posterUrl(actor.profile_path, "w185")}
                        alt={actor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{actor.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Similar Movies</h2>
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
              {similarMovies.map((movie) => (
                <div key={movie.id} className="shrink-0 w-[180px]">
                  <MovieCard movie={movie} onPlay={(m) => { setSelectedMovie(m); setShowModal(true) }} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Trailer Modal */}
      <TrailerModal
        movieId={movieId}
        movieTitle={details.title}
        originalLanguage={details.original_language}
        open={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />

      {/* Movie Modal for similar movies */}
      <MovieModal movie={selectedMovie} open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
