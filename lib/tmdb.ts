const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
const DIRECT_BASE = "https://api.themoviedb.org/3"
const IMAGE_BASE = "https://image.tmdb.org/t/p"

// Image size helpers
export const posterUrl = (path: string | null, size = "w500") =>
  path ? `${IMAGE_BASE}/${size}${path}` : "/placeholder.svg?height=450&width=300"

export const backdropUrl = (path: string | null, size = "w1280") =>
  path ? `${IMAGE_BASE}/${size}${path}` : "/placeholder.svg?height=720&width=1280"

// ── Types ────────────────────────────────────────────────────────────
export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
  original_language: string
  adult: boolean
}

export interface TMDBGenre {
  id: number
  name: string
}

interface TMDBListResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

// ── Simple in-memory cache for API responses ─────────────────────────
const apiCache = new Map<string, { data: any; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ── Global state for proxy ───────────────────────────────────────────
let useProxyByDefault = false

// ── Smart fetch with proxy fallback ──────────────────────────────────
async function tmdbFetch(endpoint: string): Promise<any> {
  // Check cache first
  const cacheKey = endpoint
  const cached = apiCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  const separator = endpoint.includes("?") ? "&" : "?"
  const url = `${DIRECT_BASE}${endpoint}${separator}api_key=${API_KEY}`

  if (!useProxyByDefault) {
    // Try direct first with a fast timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2500)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        apiCache.set(cacheKey, { data, ts: Date.now() })
        return data
      }
    } catch {
      // Direct failed — mark to use proxy by default from now on!
      useProxyByDefault = true
    }
  }

  // Try CORS proxy (corsproxy.io)
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(proxyUrl, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      apiCache.set(cacheKey, { data, ts: Date.now() })
      return data
    }
  } catch {
    // Proxy 1 failed
  }

  // Try another proxy (allorigins)
  try {
    const proxyUrl2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(proxyUrl2, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      apiCache.set(cacheKey, { data, ts: Date.now() })
      return data
    }
  } catch {
    // Proxy 2 failed
  }

  // All failed
  throw new Error(`Failed to fetch: ${endpoint}`)
}

// ── Genre Map (cached) ───────────────────────────────────────────────
let genreMapCache: Record<number, string> | null = null

// Hardcoded genre map so we don't need an API call for this
const FALLBACK_GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
}

export async function getGenreMap(): Promise<Record<number, string>> {
  if (!genreMapCache) {
    genreMapCache = { ...FALLBACK_GENRE_MAP }
  }
  return genreMapCache
}

export async function getGenreList(): Promise<TMDBGenre[]> {
  try {
    const data = await tmdbFetch("/genre/movie/list?language=en-US")
    return data.genres
  } catch {
    return Object.entries(FALLBACK_GENRE_MAP).map(([id, name]) => ({
      id: Number(id),
      name,
    }))
  }
}

// ── Helpers to resolve genre IDs → names ─────────────────────────────
export function resolveGenres(genreIds: number[], map: Record<number, string>): string[] {
  return genreIds.map((id) => map[id] || "Unknown").filter((g) => g !== "Unknown")
}

// ── API Fetchers ─────────────────────────────────────────────────────

export async function fetchTrending(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/trending/movie/week?language=en-US&page=${page}`)
}

export async function fetchNowPlaying(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/now_playing?language=en-US&page=${page}`)
}

export async function fetchNewReleases(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 14); // Capture last 2 weeks explicitly to get regional and global newest hits
  
  const todayStr = today.toISOString().split('T')[0];
  const pastStr = past.toISOString().split('T')[0];

  return tmdbFetch(`/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${pastStr}&primary_release_date.lte=${todayStr}&with_original_language=en|hi|te|ta&page=${page}`)
}

export async function fetchPopular(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/popular?language=en-US&page=${page}`)
}

export async function fetchTopRated(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/top_rated?language=en-US&page=${page}`)
}

export async function fetchByGenre(genreId: number, page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/discover/movie?language=en-US&sort_by=popularity.desc&with_genres=${genreId}&page=${page}`)
}

// ── Language-based fetchers (Bollywood, South, Korean, etc.) ─────────

export async function fetchByLanguage(lang: string, page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/discover/movie?sort_by=popularity.desc&with_original_language=${lang}&page=${page}`)
}

export async function fetchByLanguageAndGenre(lang: string, genreIds: number[], page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  const genreParam = genreIds.join(",")
  return tmdbFetch(`/discover/movie?sort_by=popularity.desc&with_original_language=${lang}&with_genres=${genreParam}&page=${page}`)
}

export async function fetchDiscover(params: {
  langs?: string[]
  genres?: number[]
  sortBy?: string
  page?: number
}): Promise<TMDBListResponse<TMDBMovie>> {
  const { langs = [], genres = [], sortBy = "popularity", page = 1 } = params

  let sortParam = "popularity.desc"
  let extraParams = ""

  if (sortBy === "rating") {
    sortParam = "vote_average.desc"
    extraParams = "&vote_count.gte=300" // To avoid 10/10 movies with 1 vote
  } else if (sortBy === "year") {
    sortParam = "primary_release_date.desc"
  } else if (sortBy === "az") {
    sortParam = "original_title.asc"
  }

  const langParam = langs.length > 0 ? `&with_original_language=${langs.join("|")}` : ""
  const genreParam = genres.length > 0 ? `&with_genres=${genres.join(",")}` : ""

  return tmdbFetch(`/discover/movie?sort_by=${sortParam}${extraParams}${langParam}${genreParam}&page=${page}`)
}

export async function fetchPersonalizedDiscover(genreIds: number[], actorIds: number[], page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  let fetchUrl = `/discover/movie?sort_by=popularity.desc&page=${page}`;
  if (genreIds.length > 0) fetchUrl += `&with_genres=${genreIds.join('|')}`;
  if (actorIds.length > 0) fetchUrl += `&with_cast=${actorIds.join('|')}`;
  return tmdbFetch(fetchUrl);
}

export async function fetchBollywood(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return fetchByLanguage("hi", page)
}

export async function fetchRecentBollywood(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 6); // last 6 months for recent trending
  const minDateStr = minDate.toISOString().split('T')[0];
  return tmdbFetch(`/discover/movie?sort_by=popularity.desc&with_original_language=hi&primary_release_date.gte=${minDateStr}&page=${page}`);
}

export async function fetchRecentSouth(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 6);
  const minDateStr = minDate.toISOString().split('T')[0];
  return tmdbFetch(`/discover/movie?sort_by=popularity.desc&with_original_language=te|ta&primary_release_date.gte=${minDateStr}&page=${page}`);
}

export async function fetchTelugu(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return fetchByLanguage("te", page)
}

export async function fetchTamil(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return fetchByLanguage("ta", page)
}

export async function fetchMalayalam(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return fetchByLanguage("ml", page)
}

export async function fetchKannada(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return fetchByLanguage("kn", page)
}

export async function fetchKorean(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return fetchByLanguage("ko", page)
}

export async function fetchHollywood(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return fetchByLanguage("en", page)
}

// ── Classic / Old movies (before 2000) ───────────────────────────────
export async function fetchClassicMovies(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/discover/movie?sort_by=vote_average.desc&vote_count.gte=1000&primary_release_date.lte=2000-12-31&page=${page}`)
}

// ── Upcoming ─────────────────────────────────────────────────────────
export async function fetchUpcoming(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/upcoming?language=en-US&page=${page}`)
}

export async function fetchFutureMovies(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const nextYearStr = nextYear.toISOString().split('T')[0];

  // Discover movies released from today up to exactly 1 year into the future, sorted by popularity
  return tmdbFetch(`/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${todayStr}&primary_release_date.lte=${nextYearStr}&page=${page}`)
}

// ── Video / Trailer types ────────────────────────────────────────────

export interface TMDBVideo {
  id: string
  key: string        // YouTube video ID
  name: string       // e.g. "Official Trailer"
  site: string       // "YouTube"
  type: string       // "Trailer", "Teaser", "Clip", "Featurette"
  official: boolean
  iso_639_1: string  // Language code: "en", "hi", "te", "ta", etc.
  iso_3166_1: string // Country code
  published_at: string
}

// Language display names for trailer selector
export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", ml: "Malayalam",
  kn: "Kannada", ko: "Korean", ja: "Japanese", es: "Spanish", fr: "French",
  de: "German", it: "Italian", pt: "Portuguese", ru: "Russian", zh: "Chinese",
  ar: "Arabic", th: "Thai", tr: "Turkish", pl: "Polish", nl: "Dutch",
  sv: "Swedish", da: "Danish", no: "Norwegian", fi: "Finnish", cs: "Czech",
  hu: "Hungarian", ro: "Romanian", el: "Greek", he: "Hebrew", id: "Indonesian",
  ms: "Malay", vi: "Vietnamese", uk: "Ukrainian", bn: "Bengali", gu: "Gujarati",
  mr: "Marathi", pa: "Punjabi",
}

// Fetch ALL available trailers for a movie (all languages)
export async function fetchMovieVideos(movieId: number): Promise<TMDBVideo[]> {
  try {
    // First try: fetch with explicit multi-language list
    const data = await tmdbFetch(
      `/movie/${movieId}/videos?include_video_language=en,hi,te,ta,ml,kn,ko,ja,es,fr,de,it,pt,ru,zh,ar,th,tr,bn,gu,mr,pa,ur,pl,nl,sv,da,no,fi,cs,hu,ro,el,he,id,ms,vi,uk,null`
    )
    const videos: TMDBVideo[] = data.results || []
    if (videos.length > 0) return videos

    // Fallback: fetch without language filter (gets default language videos)
    const fallbackData = await tmdbFetch(`/movie/${movieId}/videos`)
    return fallbackData.results || []
  } catch {
    try {
      // Last resort: try without language filter
      const fallbackData = await tmdbFetch(`/movie/${movieId}/videos`)
      return fallbackData.results || []
    } catch {
      return []
    }
  }
}

// Full movie details (extended)
export interface TMDBMovieFull extends TMDBMovie {
  genres: TMDBGenre[]
  runtime: number
  budget: number
  revenue: number
  tagline: string
  status: string
  homepage: string
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[]
  production_companies: { id: number; name: string; logo_path: string | null; origin_country: string }[]
  production_countries: { iso_3166_1: string; name: string }[]
  imdb_id: string | null
}

export interface TMDBCast {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
  known_for_department: string
}

export interface TMDBCrew {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface TMDBCredits {
  cast: TMDBCast[]
  crew: TMDBCrew[]
}

export async function fetchMovieDetails(movieId: number): Promise<TMDBMovieFull> {
  return tmdbFetch(`/movie/${movieId}?language=en-US`)
}

export async function fetchMovieCredits(movieId: number): Promise<TMDBCredits> {
  return tmdbFetch(`/movie/${movieId}/credits?language=en-US`)
}

export async function fetchSimilarMovies(movieId: number, page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/${movieId}/similar?language=en-US&page=${page}`)
}

export async function fetchRecommendedMovies(movieId: number, page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/${movieId}/recommendations?language=en-US&page=${page}`)
}

// ── Search ───────────────────────────────────────────────────────────

const MOVIE_ALIASES: Record<string, string> = {
  "toastar": "the brave little toaster",
  "batmen": "batman",
  "spidermen": "spider-man",
  "avengars": "avengers",
  "harry putter": "harry potter",
  "fast and fireous": "fast and furious",
  "kgf": "k.g.f",
  "kgf 2": "k.g.f: chapter 2",
  "bahubali": "baahubali",
  "pushpa": "pushpa: the rise",
  "pushpa 2": "pushpa 2: the rule",
  "salaar": "salaar",
  "infinity war": "avengers: infinity war",
  "endgame": "avengers: endgame",
  "starwars": "star wars",
  "the matrix": "matrix",
  "lord of the ring": "lord of the rings",
  "lotr": "lord of the rings",
}

export async function searchMovies(query: string, page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  const normQuery = query.toLowerCase().trim()
  const matchedAlias = MOVIE_ALIASES[normQuery]
  const finalQuery = matchedAlias ? matchedAlias : query
  return tmdbFetch(`/search/movie?language=en-US&query=${encodeURIComponent(finalQuery)}&page=${page}&include_adult=false`)
}

const ACTOR_ALIASES: Record<string, string> = {
  "srk": "Shah Rukh Khan",
  "shahrukh": "Shah Rukh Khan",
  "salman": "Salman Khan",
  "bhai": "Salman Khan",
  "dipika": "Deepika Padukone",
  "deepika": "Deepika Padukone",
  "aliya": "Alia Bhatt",
  "alia": "Alia Bhatt",
  "hrithik": "Hrithik Roshan",
  "hritik": "Hrithik Roshan",
  "ritik": "Hrithik Roshan",
  "katrina": "Katrina Kaif",
  "kat": "Katrina Kaif",
  "kartik": "Kartik Aaryan",
  "vicky": "Vicky Kaushal",
  "ranbir": "Ranbir Kapoor",
  "ranveer": "Ranveer Singh",
  "amitabh": "Amitabh Bachchan",
  "big b": "Amitabh Bachchan",
  "vijay": "Joseph Vijay",
  "thalapathy": "Joseph Vijay",
  "allu": "Allu Arjun",
  "prabhas": "Prabhas",
  "ntr": "N.T. Rama Rao Jr.",
  "ram charan": "Ram Charan",
  "yash": "Yash",
  "rajini": "Rajinikanth",
  "rajinikanth": "Rajinikanth",
  "akshay": "Akshay Kumar",
  "ajay": "Ajay Devgn",
  "aamir": "Aamir Khan",
  "amir": "Aamir Khan",
  "mahesh": "Mahesh Babu",
  "dhanush": "Dhanush",
}

export async function searchPerson(query: string, page = 1): Promise<TMDBListResponse<TMDBPerson>> {
  const normQuery = query.toLowerCase().trim()
  const matchedAlias = ACTOR_ALIASES[normQuery]
  const finalQuery = matchedAlias ? matchedAlias : query
  return tmdbFetch(`/search/person?language=en-US&query=${encodeURIComponent(finalQuery)}&page=${page}&include_adult=false`)
}

// Simple paginated popular fetcher (returns one page at a time, for "load more")
export async function fetchPopularPage(page = 1): Promise<TMDBListResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/popular?language=en-US&page=${page}`)
}

// ── Person / Actor ───────────────────────────────────────────────────

export interface TMDBPerson {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  known_for_department: string
  gender: number
  popularity: number
  also_known_as: string[]
  homepage: string | null
  imdb_id: string | null
}

export interface TMDBPersonMovieCredit {
  id: number
  title: string
  character?: string
  job?: string
  department?: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  overview: string
  genre_ids: number[]
  popularity: number
}

export interface TMDBPersonCredits {
  cast: TMDBPersonMovieCredit[]
  crew: TMDBPersonMovieCredit[]
}

export async function fetchPersonDetails(personId: number): Promise<TMDBPerson> {
  return tmdbFetch(`/person/${personId}?language=en-US`)
}

export async function fetchPersonMovieCredits(personId: number): Promise<TMDBPersonCredits> {
  return tmdbFetch(`/person/${personId}/movie_credits?language=en-US`)
}
