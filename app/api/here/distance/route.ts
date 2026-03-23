import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret")
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const origin = searchParams.get("origin")
  const destination = searchParams.get("destination")

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 })
  }

  // ✅ FIX: Same city/state check — normalize and compare before hitting HERE
  const normalize = (loc: string) => loc.toLowerCase().replace(/\s+/g, " ").trim()
  if (normalize(origin) === normalize(destination)) {
    return NextResponse.json({ miles: 0 })
  }

  const apiKey = process.env.HERE_API_KEY
  if (!apiKey) return NextResponse.json({ error: "HERE API key not configured" }, { status: 500 })

  try {
    const geocode = async (location: string) => {
      const url = new URL("https://geocode.search.hereapi.com/v1/geocode")
      url.searchParams.set("q", location + ", USA")
      url.searchParams.set("limit", "1")
      url.searchParams.set("apiKey", apiKey)
      const res = await fetch(url.toString())
      const data = await res.json()
      const pos = data.items?.[0]?.position
      if (!pos) throw new Error(`Could not geocode: ${location}`)
      return { coords: `${pos.lat},${pos.lng}`, lat: pos.lat, lng: pos.lng }
    }

    const [originGeo, destGeo] = await Promise.all([
      geocode(origin),
      geocode(destination),
    ])

    // ✅ FIX: Also check if geocoded coordinates are essentially the same point
    const latDiff = Math.abs(originGeo.lat - destGeo.lat)
    const lngDiff = Math.abs(originGeo.lng - destGeo.lng)
    if (latDiff < 0.01 && lngDiff < 0.01) {
      return NextResponse.json({ miles: 0 })
    }

    const routeUrl = new URL("https://router.hereapi.com/v8/routes")
    routeUrl.searchParams.set("transportMode", "truck")
    routeUrl.searchParams.set("origin", originGeo.coords)
    routeUrl.searchParams.set("destination", destGeo.coords)
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
    return NextResponse.json({ miles: null, error: "Could not calculate distance" })
  }
}