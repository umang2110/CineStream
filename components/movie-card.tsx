"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Movie } from "@/lib/movie-data"
import { addToFavorites, removeFromFavorites, isFavorite } from "@/lib/favorites"

interface MovieCardProps {
  movie: Movie
  onPlay: (movie: Movie) => void
}

export function MovieCard({ movie, onPlay }: MovieCardProps) {
  const [favorite, setFavorite] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    setFavorite(isFavorite(movie.id))
  }, [movie.id])

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (favorite) {
      removeFromFavorites(movie.id)
      setFavorite(false)
    } else {
      addToFavorites(movie.id)
      setFavorite(true)
    }
  }

  return (
    <Card
      className="group relative flex-shrink-0 w-[200px] bg-card border-border overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10"
      onClick={() => onPlay(movie)}
    >
      <div className="relative aspect-[2/3]">
        {/* Skeleton shimmer while loading */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/60 to-muted animate-pulse" />
        )}
        <Image
          src={movie.poster || "/placeholder.svg?height=300&width=200"}
          alt={movie.title}
          fill
          className={`object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          sizes="200px"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary" className="rounded-full" onClick={() => onPlay(movie)}>
            <Play className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full" onClick={handleFavoriteToggle}>
            <Heart className={`h-4 w-4 ${favorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>
        {/* Rating badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-amber-400 text-xs font-bold px-2 py-1 rounded-md">
          <Star className="h-3 w-3 fill-amber-400" />
          {movie.rating}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground truncate">{movie.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">{movie.year}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {movie.genre.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}
