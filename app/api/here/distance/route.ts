import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get("origin")       // "City, ST"
  const destination = searchParams.get("destination") // "City, ST"

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 })
  }

  const apiKey = process.env.HERE_API_KEY
  if (!apiKey) return NextResponse.json({ error: "HERE API key not configured" }, { status: 500 })

  try {
    // Step 1: Geocode origin
    const geocode = async (location: string) => {
      const url = new URL("https://geocode.search.hereapi.com/v1/geocode")
      url.searchParams.set("q", location + ", USA")
      url.searchParams.set("limit", "1")
      url.searchParams.set("apiKey", apiKey)
      const res = await fetch(url.toString())
      const data = await res.json()
      const pos = data.items?.[0]?.position
      if (!pos) throw new Error(`Could not geocode: ${location}`)
      return `${pos.lat},${pos.lng}`
    }

    const [originCoords, destCoords] = await Promise.all([
      geocode(origin),
      geocode(destination),
    ])

    // Step 2: Get route distance
    const routeUrl = new URL("https://router.hereapi.com/v8/routes")
    routeUrl.searchParams.set("transportMode", "truck")
    routeUrl.searchParams.set("origin", originCoords)
    routeUrl.searchParams.set("destination", destCoords)
    routeUrl.searchParams.set("return", "summary")
    routeUrl.searchParams.set("apiKey", apiKey)

    const routeRes = await fetch(routeUrl.toString())
    const routeData = await routeRes.json()

    const meters = routeData.routes?.[0]?.sections?.[0]?.summary?.length
    if (!meters) throw new Error("No route found")

    const miles = Math.round(meters * 0.000621371)
    return NextResponse.json({ miles })
  } catch (err) {
    console.error("HERE distance error:", err)
    // Fallback to straight-line estimate
    return NextResponse.json({ miles: null, error: "Could not calculate distance" })
  }
}