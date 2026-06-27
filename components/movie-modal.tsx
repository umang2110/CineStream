"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Play, Heart, Star, Calendar, Info, ListPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { Movie } from "@/lib/movie-data"
import { addToFavorites, removeFromFavorites, isFavorite, updateGenrePreferences } from "@/lib/favorites"
import { addToHistory } from "@/lib/history"
import { TrailerModal } from "@/components/trailer-modal"
import { AddToListModal } from "@/components/add-to-list-modal"

interface MovieModalProps {
  movie: Movie | null
  open: boolean
  onClose: () => void
}

export function MovieModal({ movie, open, onClose }: MovieModalProps) {
  const [favorite, setFavorite] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [listModalOpen, setListModalOpen] = useState(false)

  useEffect(() => {
    if (movie) {
      setFavorite(isFavorite(movie.id))
    }
  }, [movie])

  if (!movie) return null

  const handleFavoriteToggle = () => {
    if (favorite) {
      removeFromFavorites(movie.id)
      setFavorite(false)
    } else {
      addToFavorites(movie.id)
      updateGenrePreferences(movie.genre)
      setFavorite(true)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl p-0 bg-card border-border overflow-hidden max-h-[90vh] flex flex-col" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{movie.title}</DialogTitle>
          {/* Sticky close button — always visible even when scrolling */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-background transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          <div className="overflow-y-auto flex-1">

            <div className="relative h-[260px] sm:h-[320px] md:h-[380px] w-full">
              <Image
                src={movie.backdrop || "/placeholder.svg?height=400&width=800"}
                alt={movie.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

              {/* Play trailer overlay button */}
              <button
                onClick={() => {
                  setTrailerOpen(true)
                  if (movie) addToHistory(movie.id)
                }}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-110 group-hover:bg-primary transition-all duration-300">
                  <Play className="h-9 w-9 text-primary-foreground ml-1 fill-primary-foreground" />
                </div>
              </button>
            </div>

            <div className="p-6 md:p-8 -mt-16 relative z-10 pb-8">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">{movie.title}</h2>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {movie.year}
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="h-4 w-4 fill-amber-400" />
                  {movie.rating} / 10
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genre.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm font-medium border border-primary/20"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p className="text-muted-foreground text-sm md:text-lg mb-6 leading-relaxed">{movie.description}</p>

              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button
                  size="lg"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => {
                    setTrailerOpen(true)
                    if (movie) addToHistory(movie.id)
                  }}
                >
                  <Play className="mr-2 h-5 w-5 fill-white" />
                  Watch Trailer
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href={`/movie/${movie.id}`} onClick={onClose}>
                    <Info className="mr-2 h-5 w-5" />
                    Full Details
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border bg-transparent"
                  onClick={handleFavoriteToggle}
                >
                  <Heart className={`mr-2 h-5 w-5 ${favorite ? "fill-red-500 text-red-500" : ""}`} />
                  {favorite ? "Remove from Favourites" : "Favourite"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border bg-transparent"
                  onClick={() => setListModalOpen(true)}
                  id="add-to-custom-list-btn"
                >
                  <ListPlus className="mr-2 h-5 w-5" />
                  Save to List
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trailer Modal — plays video inside the website */}
      <TrailerModal
        movieId={movie.id}
        movieTitle={movie.title}
        originalLanguage={movie.originalLanguage}
        open={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />

      {/* Add to Custom List Modal */}
      <AddToListModal
        movieId={movie.id}
        movieTitle={movie.title}
        open={listModalOpen}
        onClose={() => setListModalOpen(false)}
      />
    </>
  )
}
