import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Secret check
  const secret = request.headers.get("x-internal-secret")
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = request.nextUrl
  const city = searchParams.get("city")
  if (!city) return NextResponse.json({ error: "City required" }, { status: 400 })

  const apiKey = process.env.HERE_API_KEY
  const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(city)}&apiKey=${apiKey}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    const position = data.items?.[0]?.position
    if (!position) return NextResponse.json({ error: "City not found" }, { status: 404 })
    return NextResponse.json({ lat: position.lat, lng: position.lng })
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 500 })
  }
}