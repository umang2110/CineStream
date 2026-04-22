import {
  type TMDBMovie,
  fetchTrending,
  fetchNowPlaying,
  fetchPopular,
  fetchTopRated,
  fetchByGenre,
  fetchByLanguage,
  fetchByLanguageAndGenre,
  fetchBollywood,
  fetchTelugu,
  fetchTamil,
  fetchMalayalam,
  fetchKorean,
  fetchHollywood,
  fetchClassicMovies,
  fetchUpcoming,
  fetchPopularPage,
  fetchDiscover,
  searchMovies,
  getGenreMap,
  resolveGenres,
  posterUrl,
  backdropUrl,
  fetchRecommendedMovies,
  fetchMovieDetails,
  fetchRecentBollywood,
  fetchRecentSouth,
  fetchFutureMovies,
  fetchNewReleases,
} from "./tmdb"

// ── Unified Movie interface (compatible with all components) ─────────
export interface Movie {
  id: number
  title: string
  year: number
  genre: string[]
  rating: number
  description: string
  poster: string
  backdrop: string
  genreIds: number[]
  originalLanguage: string
  popularity: number
}

export interface Category {
  id: string
  name: string
  movies: Movie[]
  isTop10?: boolean
}

// ── Convert TMDB movie → our Movie interface ─────────────────────────
export function toMovie(tmdb: TMDBMovie, genreMap: Record<number, string>): Movie {
  return {
    id: tmdb.id,
    title: tmdb.title,
    year: tmdb.release_date ? new Date(tmdb.release_date).getFullYear() : 0,
    genre: resolveGenres(tmdb.genre_ids, genreMap),
    rating: Math.round(tmdb.vote_average * 10) / 10,
    description: tmdb.overview || "No description available.",
    poster: posterUrl(tmdb.poster_path),
    backdrop: backdropUrl(tmdb.backdrop_path),
    genreIds: tmdb.genre_ids,
    originalLanguage: tmdb.original_language || "en",
    popularity: tmdb.popularity || 0,
  }
}

// ── Genre IDs for popular categories ─────────────────────────────────
export const GENRE_IDS: Record<string, number> = {
  Action: 28,
  Comedy: 35,
  Drama: 18,
  Horror: 27,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
  Animation: 16,
  Fantasy: 14,
  Documentary: 99,
}

// ── FALLBACK DATA — shown when API is completely unreachable ─────────
const FALLBACK_MOVIES: Movie[] = [
  {
    id: 550,
    title: "Fight Club",
    year: 1999,
    genre: ["Drama"],
    rating: 8.4,
    description: "A ticking-Loss-loss insurance worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
    poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg",
    genreIds: [18],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 680,
    title: "Pulp Fiction",
    year: 1994,
    genre: ["Thriller", "Crime"],
    rating: 8.5,
    description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    genreIds: [53, 80],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 278,
    title: "The Shawshank Redemption",
    year: 1994,
    genre: ["Drama", "Crime"],
    rating: 8.7,
    description: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
    poster: "https://image.tmdb.org/t/p/w500/9cjIGRQL0ohUFQ7oY00MgDBzmYH.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    genreIds: [18, 80],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 238,
    title: "The Godfather",
    year: 1972,
    genre: ["Drama", "Crime"],
    rating: 8.7,
    description: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
    poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
    genreIds: [18, 80],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 155,
    title: "The Dark Knight",
    year: 2008,
    genre: ["Action", "Crime", "Drama"],
    rating: 8.5,
    description: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations.",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BTUgMe1YEeta.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5ez.jpg",
    genreIds: [28, 80, 18],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 27205,
    title: "Inception",
    year: 2010,
    genre: ["Action", "Sci-Fi", "Adventure"],
    rating: 8.4,
    description: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to have his criminal history erased.",
    poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    genreIds: [28, 878, 12],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 603,
    title: "The Matrix",
    year: 1999,
    genre: ["Action", "Sci-Fi"],
    rating: 8.2,
    description: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
    poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",
    genreIds: [28, 878],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 429,
    title: "The Good, the Bad and the Ugly",
    year: 1966,
    genre: ["Western"],
    rating: 8.5,
    description: "While the Civil War rages, three men – a quiet loner, a ruthless hitman, and a Mexican bandit – comb the American Southwest in search of a strongbox containing $200,000 in stolen gold.",
    poster: "https://image.tmdb.org/t/p/w500/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/gnf4Cb2rms69QbCnGFJyqwBWsxv.jpg",
    genreIds: [37],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 13,
    title: "Forrest Gump",
    year: 1994,
    genre: ["Comedy", "Drama", "Romance"],
    rating: 8.5,
    description: "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do.",
    poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/ghgfzbEV7kbpbi1O3mzrfKOYKzN.jpg",
    genreIds: [35, 18, 10749],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 120,
    title: "The Lord of the Rings: The Fellowship of the Ring",
    year: 2001,
    genre: ["Adventure", "Fantasy", "Action"],
    rating: 8.4,
    description: "Young hobbit Frodo Baggins, after inheriting a mysterious ring from his uncle Bilbo, must leave his home in order to keep it from falling into the hands of its evil creator.",
    poster: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/pIUvQ9Ed35wlWhY2oU6OmwEgzjt.jpg",
    genreIds: [12, 14, 28],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 244786,
    title: "Whiplash",
    year: 2014,
    genre: ["Drama", "Music"],
    rating: 8.4,
    description: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
    poster: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/6bbZ6XlOuNs8lFtVHcMXSBjBkzU.jpg",
    genreIds: [18, 10402],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 497,
    title: "The Green Mile",
    year: 1999,
    genre: ["Fantasy", "Drama", "Crime"],
    rating: 8.5,
    description: "A supernatural tale set on death row in a Southern prison, where gentle giant John Coffey possesses the mysterious power to heal people's ailments.",
    poster: "https://image.tmdb.org/t/p/w500/8VG8fDNiy50H4FedGwdSVCu6qLd.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/Rlt20sEbOQKPVjia7lUilFm49W.jpg",
    genreIds: [14, 18, 80],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 11,
    title: "Star Wars",
    year: 1977,
    genre: ["Adventure", "Action", "Sci-Fi"],
    rating: 8.2,
    description: "Princess Leia is captured and held hostage by the evil Imperial forces in their effort to take over the galactic Empire. Venturesome Luke Skywalker and dashing captain Han Solo team together.",
    poster: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg",
    genreIds: [12, 28, 878],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 568,
    title: "Spirited Away",
    year: 2001,
    genre: ["Animation", "Family", "Fantasy"],
    rating: 8.5,
    description: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had.",
    poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg",
    genreIds: [16, 10751, 14],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 637,
    title: "Life Is Beautiful",
    year: 1997,
    genre: ["Comedy", "Drama"],
    rating: 8.5,
    description: "A touching story of an Italian book seller of Jewish ancestry who lives in his own little fairy tale. His creative and joyous character helps protect his son from the horrors of a Nazi concentration camp.",
    poster: "https://image.tmdb.org/t/p/w500/74hLDKjD5aGYOotO6esUVaeISa2.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/bORe0eI72D874TMawOOFvqWS6Xe.jpg",
    genreIds: [35, 18],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 769,
    title: "GoodFellas",
    year: 1990,
    genre: ["Drama", "Crime"],
    rating: 8.5,
    description: "The true story of Henry Hill, a half-Irish, half-Sicilian Brooklyn kid who is adopted by neighbourhood gangsters at an early age.",
    poster: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/sw7mordbZxgITU877yTpZCud90M.jpg",
    genreIds: [18, 80],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 671,
    title: "Harry Potter and the Philosopher's Stone",
    year: 2001,
    genre: ["Adventure", "Fantasy"],
    rating: 7.9,
    description: "Harry Potter has lived under the stairs at his aunt and uncle's house his whole life. But on his 11th birthday, he learns he's a powerful wizard.",
    poster: "https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDIkZiM.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/hziiv14OpD73u9gAak4XDDfBKa2.jpg",
    genreIds: [12, 14],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 299536,
    title: "Avengers: Infinity War",
    year: 2018,
    genre: ["Adventure", "Action", "Sci-Fi"],
    rating: 8.3,
    description: "As the Avengers and their allies have continued to protect the world, a new danger has emerged from the cosmic shadows: Thanos.",
    poster: "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDhRkZUg1jmRpXV.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg",
    genreIds: [12, 28, 878],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 157336,
    title: "Interstellar",
    year: 2014,
    genre: ["Adventure", "Drama", "Sci-Fi"],
    rating: 8.4,
    description: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK1DVfjko.jpg",
    genreIds: [12, 18, 878],
    originalLanguage: "en",
    popularity: 0,
  },
  {
    id: 346698,
    title: "Barbie",
    year: 2023,
    genre: ["Comedy", "Adventure", "Fantasy"],
    rating: 7.0,
    description: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils.",
    poster: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/nHf61UzkfFno5dHMC6UOS43rFtk.jpg",
    genreIds: [35, 12, 14],
    originalLanguage: "en",
    popularity: 0,
  },
]

function getFallbackCategories(): Category[] {
  return [
    { id: "trending", name: "🔥 Trending", movies: FALLBACK_MOVIES.slice(0, 10) },
    { id: "top_10_india", name: "🏆 Top 10 in India", movies: FALLBACK_MOVIES.slice(0, 10), isTop10: true },
    { id: "now_playing", name: "🎬 Now Playing", movies: FALLBACK_MOVIES.slice(5, 15) },
    { id: "top_10_action", name: "🏆 Top 10 Action", movies: FALLBACK_MOVIES.filter((m) => m.genreIds.includes(28)).slice(0, 10), isTop10: true },
    { id: "top_10_horror", name: "🏆 Top 10 Horror", movies: FALLBACK_MOVIES.filter((m) => m.genreIds.includes(27)).slice(0, 10), isTop10: true },
    { id: "action", name: "💥 Action", movies: FALLBACK_MOVIES.filter((m) => m.genreIds.includes(28)) },
    { id: "comedy", name: "😂 Comedy", movies: FALLBACK_MOVIES.filter((m) => m.genreIds.includes(35)) },
    { id: "scifi", name: "🚀 Sci-Fi", movies: FALLBACK_MOVIES.filter((m) => m.genreIds.includes(878)) },
    { id: "horror", name: "👻 Horror", movies: FALLBACK_MOVIES.filter((m) => m.genreIds.includes(27)) },
    { id: "romance", name: "💕 Romance", movies: FALLBACK_MOVIES.filter((m) => m.genreIds.includes(10749)) },
    { id: "drama", name: "🎭 Drama", movies: FALLBACK_MOVIES.filter((m) => m.genreIds.includes(18)) },
  ]
}

// ── Helper: fetch multiple pages and merge ───────────────────────────
async function fetchMultiplePages(
  fetcher: (page: number) => Promise<{ results: TMDBMovie[] }>,
  pages: number,
  genreMap: Record<number, string>
): Promise<Movie[]> {
  const pagePromises = []
  for (let i = 1; i <= pages; i++) {
    pagePromises.push(fetcher(i))
  }
  const results = await Promise.all(pagePromises)
  const allMovies = results.flatMap((r) => r.results)
  // Deduplicate by id
  const seen = new Set<number>()
  return allMovies
    .filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    .map((m) => toMovie(m, genreMap))
}

// ── Helper: Blend regional movies into global lists organically ─────
function blendMovies(globalList: Movie[], regional1: Movie[], regional2: Movie[]): Movie[] {
  const result: Movie[] = []
  const seen = new Set<number>()
  
  let gIdx = 0, r1Idx = 0, r2Idx = 0
  while (gIdx < globalList.length || r1Idx < regional1.length || r2Idx < regional2.length) {
    // Inject 3 global movies
    for(let i=0; i<3 && gIdx < globalList.length; i++) {
       const m = globalList[gIdx++]
       if (!seen.has(m.id)) { result.push(m); seen.add(m.id); }
    }
    // Inject 1 Bollywood movie
    if (r1Idx < regional1.length) {
       const m = regional1[r1Idx++]
       if (!seen.has(m.id)) { result.push(m); seen.add(m.id); }
    }
    // Inject 1 South Indian movie
    if (r2Idx < regional2.length) {
       const m = regional2[r2Idx++]
       if (!seen.has(m.id)) { result.push(m); seen.add(m.id); }
    }
  }
  return result
}

// ── Data Fetchers (multi-page for more movies) ───────────────────────

export async function fetchTrendingMovies(): Promise<Movie[]> {
  try {
    const genreMap = await getGenreMap()
    return fetchMultiplePages(fetchTrending, 3, genreMap)
  } catch {
    return FALLBACK_MOVIES.slice(0, 10)
  }
}

export async function fetchNowPlayingMovies(): Promise<Movie[]> {
  try {
    const genreMap = await getGenreMap()
    return fetchMultiplePages(fetchNowPlaying, 3, genreMap)
  } catch {
    return FALLBACK_MOVIES.slice(5, 15)
  }
}

export async function fetchPopularMovies(): Promise<Movie[]> {
  try {
    const genreMap = await getGenreMap()
    return fetchMultiplePages(fetchPopular, 3, genreMap)
  } catch {
    return FALLBACK_MOVIES
  }
}

export async function fetchTopRatedMovies(): Promise<Movie[]> {
  try {
    const genreMap = await getGenreMap()
    return fetchMultiplePages(fetchTopRated, 3, genreMap)
  } catch {
    return [...FALLBACK_MOVIES].sort((a, b) => b.rating - a.rating)
  }
}

export async function fetchMoviesByGenre(genreId: number, page = 1): Promise<Movie[]> {
  try {
    const [data, genreMap] = await Promise.all([fetchByGenre(genreId, page), getGenreMap()])
    return data.results.map((m) => toMovie(m, genreMap))
  } catch {
    return FALLBACK_MOVIES.filter((m) => m.genreIds.includes(genreId))
  }
}

// Fetch multiple pages of a genre at once
export async function fetchMoviesByGenreMultiPage(genreId: number, pages = 3): Promise<Movie[]> {
  try {
    const genreMap = await getGenreMap()
    return fetchMultiplePages((p) => fetchByGenre(genreId, p), pages, genreMap)
  } catch {
    return FALLBACK_MOVIES.filter((m) => m.genreIds.includes(genreId))
  }
}

// ── Fetch movies by language (for categories page) ───────────────────
export async function fetchMoviesByLanguage(lang: string, page = 1): Promise<Movie[]> {
  try {
    const [data, genreMap] = await Promise.all([fetchByLanguage(lang, page), getGenreMap()])
    return data.results.map((m) => toMovie(m, genreMap))
  } catch {
    return FALLBACK_MOVIES
  }
}

// ── Fetch movies by language AND genre combined ──────────────────────
export async function fetchMoviesByLanguageAndGenre(lang: string, genreIds: number[], page = 1): Promise<Movie[]> {
  try {
    const [data, genreMap] = await Promise.all([fetchByLanguageAndGenre(lang, genreIds, page), getGenreMap()])
    return data.results.map((m) => toMovie(m, genreMap))
  } catch {
    return FALLBACK_MOVIES
  }
}

// ── Fetch unified discover movies ──────────────────────────────────────
export async function fetchDiscoverMovies(params: {
  langs?: string[]
  genres?: number[]
  sortBy?: string
  page?: number
}): Promise<Movie[]> {
  try {
    const [data, genreMap] = await Promise.all([fetchDiscover(params), getGenreMap()])
    return data.results.map((m) => toMovie(m, genreMap))
  } catch {
    return FALLBACK_MOVIES
  }
}

// ── Search movies ────────────────────────────────────────────────────
export async function searchMoviesData(query: string, page = 1): Promise<Movie[]> {
  try {
    const [data, genreMap] = await Promise.all([searchMovies(query, page), getGenreMap()])
    return data.results.map((m) => toMovie(m, genreMap))
  } catch {
    return []
  }
}

// ── Global Search with Multi-Page Prefetch & Year Sort ───────────────
export async function searchMoviesGlobal(query: string): Promise<Movie[]> {
  try {
    // 1. Fetch page 1 to get total pages
    const [page1Data, genreMap] = await Promise.all([searchMovies(query, 1), getGenreMap()]);
    if (!page1Data || !page1Data.results) return [];

    const allResults = [...page1Data.results];
    const totalPages = Math.min(page1Data.total_pages, 8); // Cap at 8 pages (~160 movies max) for speed and relevance

    // 2. Concurrently fetch all remaining pages
    if (totalPages > 1) {
      const pagePromises = [];
      for (let i = 2; i <= totalPages; i++) {
        pagePromises.push(searchMovies(query, i));
      }
      const resolvedPages = await Promise.all(pagePromises);
      resolvedPages.forEach(p => {
        if (p && p.results) {
          allResults.push(...p.results);
        }
      });
    }

    // 3. Convert Format
    const allMovies = allResults.map(m => toMovie(m, genreMap));

    // 4. Deduplicate
    const seen = new Set<number>();
    const finalUnique = allMovies.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    // 5. Strictly Sort by Year (Descending) globally before returning
    return finalUnique.sort((a, b) => b.year - a.year);
  } catch {
    return [];
  }
}

// ── Paginated popular movies (for categories "load more" with no filters) ──
export async function fetchPopularMoviesPage(page = 1): Promise<Movie[]> {
  try {
    const [data, genreMap] = await Promise.all([fetchPopularPage(page), getGenreMap()])
    return data.results.map((m) => toMovie(m, genreMap))
  } catch {
    return FALLBACK_MOVIES
  }
}

// ── Fetch initial categories for homepage (fast load) ──────────────────
export async function fetchInitialCategories(): Promise<Category[]> {
  try {
    const genreMap = await getGenreMap()

    // 1 single API call to load the page practically instantly
    const [globalTrending, bollyTrending, teluguTrending, newReleasesList] = await Promise.all([
      fetchMultiplePages(fetchTrending, 1, genreMap),
      fetchMultiplePages(fetchRecentBollywood, 1, genreMap),
      fetchMultiplePages(fetchRecentSouth, 1, genreMap),
      fetchMultiplePages(fetchNewReleases, 2, genreMap) // Fetch 2 pages of new releases
    ])

    const trending = blendMovies(globalTrending, bollyTrending, teluguTrending)

    return [
      { id: "new_releases", name: "🆕 New Releases", movies: newReleasesList },
      { id: "trending", name: "🔥 Trending", movies: trending },
      { id: "top_10_today", name: "🏆 Top 10 Movies Today", movies: trending.slice(0, 10), isTop10: true },
    ]
  } catch {
    console.warn("TMDB API unreachable — using fallback movie data")
    return getFallbackCategories().slice(0, 2)
  }
}

// ── Fetch secondary categories for homepage (lazy load) ────────────────
export async function fetchSecondaryCategories(): Promise<Category[]> {
  try {
    const genreMap = await getGenreMap()

    // Now Playing and Bollywood are shifted here for lazy loading
    const [
      globalNowPlaying, recentBolly, recentSouth, bollywood, telugu, tamil, malayalam,
      hollywood, korean, classic, action, comedy, scifi,
      horror, romance, drama, thriller, animation
    ] = await Promise.all([
      fetchMultiplePages(fetchNowPlaying, 1, genreMap),
      fetchMultiplePages(fetchRecentBollywood, 1, genreMap),
      fetchMultiplePages(fetchRecentSouth, 1, genreMap),
      fetchMultiplePages(fetchBollywood, 1, genreMap),
      fetchMultiplePages(fetchTelugu, 1, genreMap),
      fetchMultiplePages(fetchTamil, 1, genreMap),
      fetchMultiplePages(fetchMalayalam, 1, genreMap),
      fetchMultiplePages(fetchHollywood, 1, genreMap),
      fetchMultiplePages(fetchKorean, 1, genreMap),
      fetchMultiplePages(fetchClassicMovies, 1, genreMap),
      fetchMultiplePages((p) => fetchByGenre(GENRE_IDS.Action, p), 1, genreMap),
      fetchMultiplePages((p) => fetchByGenre(GENRE_IDS.Comedy, p), 1, genreMap),
      fetchMultiplePages((p) => fetchByGenre(GENRE_IDS["Sci-Fi"], p), 1, genreMap),
      fetchMultiplePages((p) => fetchByGenre(GENRE_IDS.Horror, p), 1, genreMap),
      fetchMultiplePages((p) => fetchByGenre(GENRE_IDS.Romance, p), 1, genreMap),
      fetchMultiplePages((p) => fetchByGenre(GENRE_IDS.Drama, p), 1, genreMap),
      fetchMultiplePages((p) => fetchByGenre(GENRE_IDS.Thriller, p), 1, genreMap),
      fetchMultiplePages((p) => fetchByGenre(GENRE_IDS.Animation, p), 1, genreMap),
    ])

    const nowPlaying = blendMovies(globalNowPlaying, recentBolly, recentSouth)

    return [
      { id: "now_playing", name: "🎬 Now Playing", movies: nowPlaying },
      { id: "top_10_india", name: "🏆 Top 10 in India", movies: bollywood.slice(0, 10), isTop10: true },
      { id: "top_10_horror", name: "🏆 Top 10 Horror", movies: horror.slice(0, 10), isTop10: true },
      { id: "top_10_action", name: "🏆 Top 10 Action", movies: action.slice(0, 10), isTop10: true },
      { id: "bollywood", name: "🇮🇳 Bollywood", movies: bollywood },
      { id: "telugu", name: "🎥 Telugu", movies: telugu },
      { id: "tamil", name: "🎞️ Tamil", movies: tamil },
      { id: "malayalam", name: "🌴 Malayalam", movies: malayalam },
      { id: "hollywood", name: "🇺🇸 Hollywood", movies: hollywood },
      { id: "korean", name: "🇰🇷 Korean", movies: korean },
      { id: "classic", name: "🏛️ Classic", movies: classic },
      { id: "action", name: "💥 Action", movies: action },
      { id: "comedy", name: "😂 Comedy", movies: comedy },
      { id: "scifi", name: "🚀 Sci-Fi", movies: scifi },
      { id: "horror", name: "👻 Horror", movies: horror },
      { id: "romance", name: "💕 Romance", movies: romance },
      { id: "drama", name: "🎭 Drama", movies: drama },
      { id: "thriller", name: "🔪 Thriller", movies: thriller },
      { id: "animation", name: "✨ Animation", movies: animation },
    ]
  } catch {
    console.warn("TMDB API unreachable — using fallback movie data")
    return getFallbackCategories().slice(2)
  }
}

// ── NEW: Recommendation fetcher ──────────────────────────────────────
export async function fetchMovieRecommendationsData(movieId: number): Promise<Movie[]> {
  try {
    const [data, genreMap] = await Promise.all([fetchRecommendedMovies(movieId), getGenreMap()])
    return data.results.map((m: any) => toMovie(m, genreMap))
  } catch {
    // If it fails, return empty or some fallback
    return []
  }
}

// ── NEW: Single movie fetcher ────────────────────────────────────────
export async function fetchMovieByIdData(movieId: number): Promise<Movie | null> {
  try {
    const [data, genreMap] = await Promise.all([fetchMovieDetails(movieId), getGenreMap()])
    // fetchMovieDetails returns TMDBMovieFull which has `genres: [{id,name}]`
    // instead of `genre_ids: [number]`. Normalize before calling toMovie.
    const normalized = {
      ...data,
      genre_ids: data.genres ? data.genres.map((g: any) => g.id) : (data.genre_ids || []),
    }
    return toMovie(normalized, genreMap)
  } catch {
    // If not found in API, check fallbacks
    const fallback = FALLBACK_MOVIES.find((m) => m.id === movieId)
    return fallback || null
  }
}

// ── Upcoming movies with release dates ──────────────────────────────
export interface UpcomingMovie extends Movie {
  releaseDate: string // ISO date string e.g. "2024-05-15"
}

export async function fetchUpcomingMoviesData(pages = 8): Promise<UpcomingMovie[]> {
  try {
    const genreMap = await getGenreMap()
    // We fetch a lot of pages (e.g. 160 movies) to guarantee a full year timeline
    const pagePromises = Array.from({ length: pages }, (_, i) => fetchFutureMovies(i + 1))
    const results = await Promise.all(pagePromises)
    const allMovies = results.flatMap((r) => r.results)

    // Deduplicate
    const seen = new Set<number>()
    const unique = allMovies.filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return unique
      .filter((m) => m.release_date)
      .map((m) => ({
        ...toMovie(m, genreMap),
        releaseDate: m.release_date,
      }))
      .filter((m) => new Date(m.releaseDate) >= today) // Strict front filter
      .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()) // Sort nearest to furthest
  } catch {
    return []
  }
}

// ── NEW: Personalized User Requirements ────────────────────────────────
import type { UserPreferences } from "./preferences"

export interface ScopedRecommendation {
  title: string;
  movies: Movie[];
  categoryId?: string;
}

export async function fetchPersonalizedRecommendationsData(prefs: UserPreferences): Promise<ScopedRecommendation[]> {
  try {
    const genreIds = prefs.favoriteGenres || [];
    const actorIds = prefs.favoriteActors || [];

    if (genreIds.length === 0 && actorIds.length === 0) {
      const trending = await fetchTrendingMovies();
      return [{ title: "Trending For You", movies: trending, categoryId: "trending" }];
    }

    const promises: Promise<{title: string, data: any, categoryId: string, targetGenreName?: string}>[] = [];
    const t = await import('./tmdb');
    
    // Fetch genres independently
    for (const genre of genreIds) {
       promises.push(
         t.fetchPersonalizedDiscover([genre.id], []).then(data => ({ 
            title: `Because you like ${genre.name}`, 
            data,
            categoryId: `genre_${genre.id}`,
            targetGenreName: genre.name
         }))
       );
    }
    
    // Fetch actors independently
    for (const actor of actorIds) {
       promises.push(
         t.fetchPersonalizedDiscover([], [actor.id]).then(data => ({ 
            title: `Top Picks for ${actor.name}`, 
            data,
            categoryId: `actor_${actor.id}`
         }))
       );
    }

    const genreMap = await getGenreMap();
    const results = await Promise.all(promises);
    
    const finalScopedRecs: ScopedRecommendation[] = [];
    
    for (const res of results) {
      if (res && res.data && res.data.results && res.data.results.length > 0) {
        // Filter out bad/low quality results if you want, but we just map them over
        const movies = res.data.results.map((m: any) => {
           const movie = toMovie(m, genreMap);
           if (res.targetGenreName && movie.genre.includes(res.targetGenreName)) {
               movie.genre = [res.targetGenreName, ...movie.genre.filter((g: string) => g !== res.targetGenreName)];
           }
           return movie;
        });
        finalScopedRecs.push({
           categoryId: res.categoryId,
           title: res.title,
           movies: movies
        });
      }
    }
    
    return finalScopedRecs;
  } catch {
    return [];
  }
}

// ── NEW: Fetch movies by Category ID (for "View All" pages) ──────────
export async function fetchMoviesByCategoryId(id: string, page = 1): Promise<Movie[]> {
  try {
    const genreMap = await getGenreMap();
    let data;

    switch (id) {
      case "trending":
        data = await fetchTrending(page); break;
      case "new_releases":
        data = await fetchNewReleases(page); break;
      case "now_playing":
        data = await fetchNowPlaying(page); break;
      case "bollywood":
        data = await fetchBollywood(page); break;
      case "telugu":
        data = await fetchTelugu(page); break;
      case "tamil":
        data = await fetchTamil(page); break;
      case "malayalam":
        data = await fetchMalayalam(page); break;
      case "hollywood":
        data = await fetchHollywood(page); break;
      case "korean":
        data = await fetchKorean(page); break;
      case "classic":
        data = await fetchClassicMovies(page); break;
      case "action":
        data = await fetchByGenre(GENRE_IDS.Action, page); break;
      case "comedy":
        data = await fetchByGenre(GENRE_IDS.Comedy, page); break;
      case "scifi":
        data = await fetchByGenre(GENRE_IDS["Sci-Fi"], page); break;
      case "horror":
        data = await fetchByGenre(GENRE_IDS.Horror, page); break;
      case "romance":
        data = await fetchByGenre(GENRE_IDS.Romance, page); break;
      case "drama":
        data = await fetchByGenre(GENRE_IDS.Drama, page); break;
      case "thriller":
        data = await fetchByGenre(GENRE_IDS.Thriller, page); break;
      case "animation":
        data = await fetchByGenre(GENRE_IDS.Animation, page); break;
      default:
        // Handle personalized genres and actors
        if (id.startsWith("genre_")) {
          const genreId = parseInt(id.replace("genre_", ""));
          const t = await import("./tmdb");
          data = await t.fetchPersonalizedDiscover([genreId], [], page);
          if (data && data.results) {
             const movies = data.results.map((m: any) => toMovie(m, genreMap));
             const targetGenreName = genreMap[genreId];
             if (targetGenreName) {
                movies.forEach((movie: Movie) => {
                   if (movie.genre.includes(targetGenreName)) {
                       movie.genre = [targetGenreName, ...movie.genre.filter(g => g !== targetGenreName)];
                   }
                });
             }
             return movies;
          }
        } else if (id.startsWith("actor_")) {
          const actorId = parseInt(id.replace("actor_", ""));
          const t = await import("./tmdb");
          data = await t.fetchPersonalizedDiscover([], [actorId], page);
        } else {
          // Fallback for unknown IDs
          data = await fetchPopularPage(page);
        }
    }

    if (!data || !data.results) return [];
    return data.results.map((m: any) => toMovie(m, genreMap));
  } catch {
    return [];
  }
}

export function getCategoryNameById(id: string): string {
  if (!id) return "Movies";
  
  if (id.startsWith("genre_")) {
     const genreId = parseInt(id.replace("genre_", ""));
     if (typeof window !== "undefined") {
         const storedKeys = Object.keys(localStorage).filter(k => k.startsWith("user_preferences"));
         for (const key of storedKeys) {
             const stored = localStorage.getItem(key);
             if (stored) {
                 try {
                     const prefs = JSON.parse(stored);
                     const matchedGenre = prefs.favoriteGenres?.find((g: any) => g.id === genreId);
                     if (matchedGenre) return `Because you like ${matchedGenre.name}`;
                 } catch {}
             }
         }
     }
     return "Recommended Genre";
  }
  
  if (id.startsWith("actor_")) {
     const actorId = parseInt(id.replace("actor_", ""));
     if (typeof window !== "undefined") {
         const storedKeys = Object.keys(localStorage).filter(k => k.startsWith("user_preferences"));
         for (const key of storedKeys) {
             const stored = localStorage.getItem(key);
             if (stored) {
                 try {
                     const prefs = JSON.parse(stored);
                     const matchedActor = prefs.favoriteActors?.find((a: any) => a.id === actorId);
                     if (matchedActor) return `Top Picks for ${matchedActor.name}`;
                 } catch {}
             }
         }
     }
     return "Recommended Actor";
  }

  const map: Record<string, string> = {
    trending: "🔥 Trending",
    new_releases: "🆕 New Releases",
    now_playing: "🎬 Now Playing",
    bollywood: "🇮🇳 Bollywood",
    telugu: "🎥 Telugu",
    tamil: "🎞️ Tamil",
    malayalam: "🌴 Malayalam",
    hollywood: "🇺🇸 Hollywood",
    korean: "🇰🇷 Korean",
    classic: "🏛️ Classic",
    action: "💥 Action",
    comedy: "😂 Comedy",
    scifi: "🚀 Sci-Fi",
    horror: "👻 Horror",
    romance: "💕 Romance",
    drama: "🎭 Drama",
    thriller: "🔪 Thriller",
    animation: "✨ Animation",
  };
  return map[id] || "Movies";
}
