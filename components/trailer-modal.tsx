"use client"

import { useEffect, useState } from "react"
import { X, Play, Loader2, Globe } from "lucide-react"
import { fetchMovieVideos, type TMDBVideo, LANGUAGE_NAMES } from "@/lib/tmdb"

interface TrailerModalProps {
  movieId: number | null
  movieTitle: string
  originalLanguage?: string
  open: boolean
  onClose: () => void
}

export function TrailerModal({ movieId, movieTitle, originalLanguage, open, onClose }: TrailerModalProps) {
  const [videos, setVideos] = useState<TMDBVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<TMDBVideo | null>(null)
  const [selectedLang, setSelectedLang] = useState<string>("all")
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !movieId) return

    async function loadVideos() {
      setLoading(true)
      try {
        const allVideos = await fetchMovieVideos(movieId!)
        let trailers = allVideos.filter(
          (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser" || v.type === "Clip" || v.type === "Featurette" || v.type === "Behind the Scenes")
        )

        // Fix mistagged languages: for non-English movies, TMDB often tags
        // native-language trailers as "en". If the movie's original language
        // is NOT English, we re-tag all "en" videos to the movie's actual language.
        // It's extremely common for Hindi/regional trailers to be mistagged as "en",
        // causing them to appear in the English tab incorrectly.
        if (originalLanguage && originalLanguage !== "en") {
          trailers = trailers.map(v =>
            v.iso_639_1 === "en"
              ? { ...v, iso_639_1: originalLanguage }
              : v
          )
        }

        trailers.sort((a, b) => {
          // Prioritize: Official Trailer > Trailer > Teaser > Clip > Featurette > BTS
          const typeOrder: Record<string, number> = { "Trailer": 0, "Teaser": 1, "Clip": 2, "Featurette": 3, "Behind the Scenes": 4 }
          if (a.official && !b.official) return -1
          if (!a.official && b.official) return 1
          const aOrder = typeOrder[a.type] ?? 5
          const bOrder = typeOrder[b.type] ?? 5
          if (aOrder !== bOrder) return aOrder - bOrder
          return 0
        })

        // For non-English movies, prioritize videos in the movie's language
        if (originalLanguage && originalLanguage !== "en") {
          trailers.sort((a, b) => {
            const aIsNative = a.iso_639_1 === originalLanguage ? 0 : 1
            const bIsNative = b.iso_639_1 === originalLanguage ? 0 : 1
            return aIsNative - bIsNative
          })
        }

        setVideos(trailers)
        if (trailers.length > 0) setSelectedVideo(trailers[0])
      } catch {
        setVideos([])
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
    return () => {
      setVideos([])
      setSelectedVideo(null)
      setSelectedLang("all")
      setHoveredVideo(null)
    }
  }, [open, movieId, originalLanguage])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  const availableLanguages = Array.from(new Set(videos.map((v) => v.iso_639_1))).sort((a, b) => {
    if (a === "en") return -1
    if (b === "en") return 1
    if (a === "hi") return -1
    if (b === "hi") return 1
    return (LANGUAGE_NAMES[a] || a).localeCompare(LANGUAGE_NAMES[b] || b)
  })

  const filteredVideos = selectedLang === "all"
    ? videos
    : videos.filter((v) => v.iso_639_1 === selectedLang)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* Full modal — no scroll, everything fits on screen */}
      <div className="relative w-[95vw] max-w-6xl bg-background rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col" style={{ maxHeight: "95vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Play className="h-5 w-5 text-red-500 shrink-0" />
            <h2 className="text-base font-semibold text-foreground truncate">{movieTitle}</h2>
            {selectedVideo && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0">
                {LANGUAGE_NAMES[selectedVideo.iso_639_1] || selectedVideo.iso_639_1} • {selectedVideo.type}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors shrink-0">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Video Player — takes most of the space */}
        {loading ? (
          <div className="flex items-center justify-center bg-black shrink-0" style={{ height: "55vh" }}>
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground">Loading trailers...</p>
            </div>
          </div>
        ) : selectedVideo ? (
          <div className="relative w-full bg-black shrink-0" style={{ height: "55vh" }}>
            <iframe
              key={selectedVideo.key}
              src={`https://www.youtube.com/embed/${selectedVideo.key}?autoplay=1&rel=0&modestbranding=1`}
              title={selectedVideo.name}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex items-center justify-center bg-black/50 shrink-0" style={{ height: "55vh" }}>
            <div className="flex flex-col items-center gap-3">
              <Play className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No trailers available</p>
            </div>
          </div>
        )}

        {/* Bottom section — language filter + horizontal trailer strip */}
        {videos.length > 0 && (
          <div className="border-t border-border bg-background shrink-0">
            {/* Language filter row */}
            {availableLanguages.length > 1 && (
              <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2 overflow-x-auto">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedLang("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      selectedLang === "all"
                        ? "bg-red-600 text-white"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    All ({videos.length})
                  </button>
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        selectedLang === lang
                          ? "bg-red-600 text-white"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {LANGUAGE_NAMES[lang] || lang} ({videos.filter((v) => v.iso_639_1 === lang).length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Horizontal trailer thumbnails — NO vertical scroll, only horizontal */}
            <div className="px-4 py-3 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="relative shrink-0"
                    onMouseEnter={() => setHoveredVideo(video.id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className={`relative w-40 rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedVideo?.id === video.id
                          ? "ring-2 ring-red-500 scale-105"
                          : "hover:scale-105 hover:ring-2 hover:ring-white/30"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-40 h-[90px] bg-black">
                        <img
                          src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                          <Play className="h-6 w-6 text-white fill-white drop-shadow-lg" />
                        </div>
                        {/* Currently playing indicator */}
                        {selectedVideo?.id === video.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
                        )}
                      </div>
                    </button>

                    {/* Hover tooltip — shows name + language */}
                    {hoveredVideo === video.id && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                        <div className="bg-black/95 text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 whitespace-nowrap max-w-[250px]">
                          <p className="text-sm font-medium truncate">{video.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-blue-300">
                              {LANGUAGE_NAMES[video.iso_639_1] || video.iso_639_1}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">{video.type}</span>
                            {video.official && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-emerald-400">Official</span>
                              </>
                            )}
                          </div>
                          {/* Tooltip arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/95" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
