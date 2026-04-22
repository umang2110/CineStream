"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, Heart, Info, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Movie } from "@/lib/movie-data"
import { addToFavorites, removeFromFavorites, isFavorite } from "@/lib/favorites"
import { addToHistory } from "@/lib/history"
import { TrailerModal } from "@/components/trailer-modal"

interface HeroBannerProps {
  movie: Movie
  onPlay: (movie: Movie) => void
  onInfo: (movie: Movie) => void
}

export function HeroBanner({ movie, onPlay, onInfo }: HeroBannerProps) {
  const [favorite, setFavorite] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)

  useEffect(() => {
    setFavorite(isFavorite(movie.id))
  }, [movie.id])

  const handleFavoriteToggle = () => {
    if (favorite) {
      removeFromFavorites(movie.id)
      setFavorite(false)
    } else {
      addToFavorites(movie.id)
      setFavorite(true)
    }
  }

  return (
    <>
      <div className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src={movie.backdrop || "/placeholder.svg?height=720&width=1280"}
          alt={movie.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="container mx-auto max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 text-balance drop-shadow-lg">
              {movie.title}
            </h1>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-lg text-muted-foreground">{movie.year}</span>
              <span className="flex items-center gap-1 text-lg text-amber-400 font-semibold">
                <Star className="h-5 w-5 fill-amber-400" />
                {movie.rating}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genre.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-medium border border-white/20"
                >
                  {g}
                </span>
              ))}
            </div>
            <p className="text-lg text-muted-foreground mb-6 text-pretty line-clamp-3">
              {movie.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  setTrailerOpen(true)
                  addToHistory(movie.id)
                }}
              >
                <Play className="mr-2 h-5 w-5 fill-white" />
                Watch Trailer
              </Button>
              <Button size="lg" variant="secondary" onClick={() => onInfo(movie)}>
                <Info className="mr-2 h-5 w-5" />
                More Info
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border bg-transparent"
                onClick={handleFavoriteToggle}
              >
                <Heart className={`mr-2 h-5 w-5 ${favorite ? "fill-red-500 text-red-500" : ""}`} />
                {favorite ? "Remove" : "Add to List"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TrailerModal
        movieId={movie.id}
        movieTitle={movie.title}
        originalLanguage={movie.originalLanguage}
        open={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />
    </>
  )
}
