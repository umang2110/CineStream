"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { isAuthenticated } from "@/lib/auth"
import {
  fetchPersonDetails,
  fetchPersonMovieCredits,
  posterUrl,
  type TMDBPerson,
  type TMDBPersonMovieCredit,
} from "@/lib/tmdb"
import {
  ArrowLeft, Loader2, User, Calendar, MapPin, Star,
  ExternalLink, Film, Clapperboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"

function calculateAge(birthday: string, deathday?: string | null): number {
  const end = deathday ? new Date(deathday) : new Date()
  const birth = new Date(birthday)
  let age = end.getFullYear() - birth.getFullYear()
  const m = end.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
  return age
}

export default function PersonPage() {
    const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const params = useParams()
  const personId = Number(params.id)

  const [person, setPerson] = useState<TMDBPerson | null>(null)
  const [castCredits, setCastCredits] = useState<TMDBPersonMovieCredit[]>([])
  const [crewCredits, setCrewCredits] = useState<TMDBPersonMovieCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [showFullBio, setShowFullBio] = useState(false)
  const [activeTab, setActiveTab] = useState<"cast" | "crew">("cast")
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)

    async function loadPerson() {
      setLoading(true)
      try {
        const [details, credits] = await Promise.all([
          fetchPersonDetails(personId),
          fetchPersonMovieCredits(personId),
        ])
        setPerson(details)

        // Sort cast by popularity (most popular first), deduplicate
        const castSeen = new Set<number>()
        const sortedCast = (credits.cast || [])
          .filter((m) => {
            if (castSeen.has(m.id)) return false
            castSeen.add(m.id)
            return true
          })
          .sort((a, b) => b.popularity - a.popularity)
        setCastCredits(sortedCast)

        // Sort crew by popularity, deduplicate
        const crewSeen = new Set<string>()
        const sortedCrew = (credits.crew || [])
          .filter((m) => {
            const key = `${m.id}-${m.job}`
            if (crewSeen.has(key)) return false
            crewSeen.add(key)
            return true
          })
          .sort((a, b) => b.popularity - a.popularity)
        setCrewCredits(sortedCrew)
      } catch (err) {
        console.error("Failed to load person:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPerson()
    window.scrollTo(0, 0)
  }, [personId, router])

  if (!mounted) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-lg">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-muted-foreground text-lg">Person not found</p>
        </div>
      </div>
    )
  }

  const activeCredits = activeTab === "cast" ? castCredits : crewCredits
  const bioText = person.biography || "No biography available."
  const shouldTruncateBio = bioText.length > 500

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Person header */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            {/* Photo */}
            <div className="shrink-0">
              <div className="w-[220px] h-[330px] rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-secondary">
                {person.profile_path ? (
                  <Image
                    src={posterUrl(person.profile_path, "h632")}
                    alt={person.name}
                    width={220}
                    height={330}
                    className="w-full h-full object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">{person.name}</h1>

              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm font-medium border border-primary/20">
                  {person.known_for_department}
                </span>
                {person.birthday && (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(person.birthday).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {" "}({calculateAge(person.birthday, person.deathday)} {person.deathday ? "years old at death" : "years old"})
                  </span>
                )}
                {person.deathday && (
                  <span className="text-muted-foreground text-sm">
                    — Died: {new Date(person.deathday).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    {person.place_of_birth}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-5">
                <div className="bg-secondary/60 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{castCredits.length}</p>
                  <p className="text-xs text-muted-foreground">Movies (Acting)</p>
                </div>
                {crewCredits.length > 0 && (
                  <div className="bg-secondary/60 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{crewCredits.length}</p>
                    <p className="text-xs text-muted-foreground">Movies (Crew)</p>
                  </div>
                )}
              </div>

              {/* External links */}
              <div className="flex gap-2 mb-6">
                {person.imdb_id && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://www.imdb.com/name/${person.imdb_id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      IMDb
                    </a>
                  </Button>
                )}
              </div>

              {/* Biography */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Biography</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {shouldTruncateBio && !showFullBio ? bioText.slice(0, 500) + "..." : bioText}
                </p>
                {shouldTruncateBio && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="text-primary text-sm mt-2 hover:underline font-medium"
                  >
                    {showFullBio ? "Show less" : "Read more"}
                  </button>
                )}
              </div>

              {/* Also known as */}
              {person.also_known_as?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Also known as</p>
                  <p className="text-sm text-muted-foreground">{person.also_known_as.slice(0, 5).join(" • ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Filmography tabs */}
          <div className="mb-6">
            <div className="flex gap-1 border-b border-border">
              <button
                onClick={() => setActiveTab("cast")}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "cast"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Film className="h-4 w-4" />
                Acting ({castCredits.length})
              </button>
              {crewCredits.length > 0 && (
                <button
                  onClick={() => setActiveTab("crew")}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === "crew"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Clapperboard className="h-4 w-4" />
                  Crew ({crewCredits.length})
                </button>
              )}
            </div>
          </div>

          {/* Movie grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {activeCredits.map((movie, idx) => (
              <Link
                key={`${movie.id}-${movie.character || movie.job || idx}`}
                href={`/movie/${movie.id}`}
                className="group"
              >
                <div className="rounded-xl overflow-hidden bg-secondary border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  {/* Poster */}
                  <div className="relative aspect-[2/3] bg-black">
                    {movie.poster_path ? (
                      <img
                        src={posterUrl(movie.poster_path, "w342")}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Film className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {/* Rating badge */}
                    {movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground truncate">{movie.title}</p>
                    {movie.release_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(movie.release_date).getFullYear()}
                      </p>
                    )}
                    {activeTab === "cast" && movie.character && (
                      <p className="text-xs text-primary mt-1 truncate">as {movie.character}</p>
                    )}
                    {activeTab === "crew" && movie.job && (
                      <p className="text-xs text-emerald-400 mt-1 truncate">{movie.job}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {activeCredits.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">No {activeTab === "cast" ? "acting" : "crew"} credits found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
