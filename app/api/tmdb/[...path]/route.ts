import { NextResponse } from "next/server"

const TMDB_BASE = "https://api.themoviedb.org/3"

function getApiKey() {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB_API_KEY missing" }, { status: 500 })
  }

  const { path = [] } = await ctx.params
  const joinedPath = path.join("/")

  // Forward query string as-is
  const url = new URL(_req.url)
  const qs = url.searchParams.toString()

  const upstream = `${TMDB_BASE}/${joinedPath}${qs ? `?${qs}&api_key=${apiKey}` : `?api_key=${apiKey}`}`

  const res = await fetch(upstream, {
    // Avoid caching secrets across users at the edge/browser
    cache: "no-store",
  })

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
      // Allow browser calls from your site
      "access-control-allow-origin": "*",
    },
  })
}

