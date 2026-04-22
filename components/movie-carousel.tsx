"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MovieCard } from "./movie-card"
import type { Movie } from "@/lib/movie-data"

interface MovieCarouselProps {
  categoryId: string
  title: string
  movies: Movie[]
  isTop10?: boolean
  onMovieClick: (movie: Movie) => void
}

export function MovieCarousel({ categoryId, title, movies, isTop10, onMovieClick }: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      // Scroll by 80% of the visible container width to show the next 'page' of movies
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between px-4">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {!isTop10 && (
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <a href={`/category/${categoryId}`}>
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
      <div className="relative group">
        {/* Left Arrow */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black text-white p-2 rounded-full opacity-60 hover:opacity-100 transition-all hidden sm:flex items-center justify-center backdrop-blur-sm"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-8 pt-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie, index) => (
            <div key={movie.id} className="snap-start shrink-0 relative">
              {isTop10 ? (
                <div className="flex items-end">
                  <span 
                    className="font-black text-background drop-shadow-xl z-0 -mr-4 sm:-mr-6 md:-mr-8 select-none leading-[0.8] text-[72px] sm:text-[96px] md:text-[120px]"
                    style={{ 
                      WebkitTextStroke: '2px hsl(var(--foreground))'
                    }}
                  >
                    {index + 1}
                  </span>
                  <div className="z-10">
                    <MovieCard movie={movie} onPlay={onMovieClick} />
                  </div>
                </div>
              ) : (
                <MovieCard movie={movie} onPlay={onMovieClick} />
              )}
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black text-white p-2 rounded-full opacity-60 hover:opacity-100 transition-all hidden sm:flex items-center justify-center backdrop-blur-sm"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>
    </div>
  )
}
