import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Secret check
  const secret = request.headers.get("x-internal-secret")
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  if (!q || q.length < 2) return NextResponse.json({ items: [] })

  const apiKey = process.env.HERE_API_KEY
  if (!apiKey) return NextResponse.json({ error: "HERE API key not configured" }, { status: 500 })

  try {
    const url = new URL("https://autocomplete.search.hereapi.com/v1/autocomplete")
    url.searchParams.set("q", q)
    url.searchParams.set("in", "countryCode:USA,CAN")
    url.searchParams.set("types", "city")
    url.searchParams.set("limit", "6")
    url.searchParams.set("apiKey", apiKey)

    const res = await fetch(url.toString())
    const data = await res.json()

    const items = (data.items ?? []).map((item: any) => {
      const addr = item.address
      return {
        label: `${addr.city}, ${addr.stateCode ?? addr.state}`,
        city: addr.city,
        state: addr.stateCode ?? addr.state,
        country: addr.countryCode,
      }
    }).filter((item: any) => item.city && item.state)

    return NextResponse.json({ items })
  } catch (err) {
    console.error("HERE autocomplete error:", err)
    return NextResponse.json({ items: [] })
  }
}