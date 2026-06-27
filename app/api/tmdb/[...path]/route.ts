import { NextResponse } from "next/server"
import dns from "node:dns"

// Override Node.js default DNS to use Cloudflare + Google DNS servers
// This bypasses ISP-level DNS blocking (e.g., Jio in India blocking TMDB)
dns.setDefaultResultOrder("ipv4first")
const resolver = new dns.Resolver()
resolver.setServers(["1.1.1.1", "8.8.8.8"])

// Monkey-patch dns.lookup for this process to use our custom resolver for TMDB
const originalLookup = dns.lookup
const patchedLookup: typeof dns.lookup = function (hostname: any, options: any, callback: any) {
  if (typeof options === "function") {
    callback = options
    options = {}
  }

  if (hostname === "api.themoviedb.org") {
    resolver.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return originalLookup(hostname, options, callback)
      }
      const isAll = options && options.all
      if (isAll) {
        const results = addresses.map((ip: string) => ({ address: ip, family: 4 }))
        callback(null, results)
      } else {
        callback(null, addresses[0], 4)
      }
    })
  } else {
    originalLookup(hostname, options, callback)
  }
} as any
dns.lookup = patchedLookup

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

  try {
    const res = await fetch(upstream, {
      cache: "no-store",
    })

    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
        "access-control-allow-origin": "*",
      },
    })
  } catch (err: any) {
    console.error("TMDB API fetch error:", err?.message || err)
    return NextResponse.json(
      { error: "Failed to reach TMDB API", details: err?.message },
      { status: 502 }
    )
  }
}
