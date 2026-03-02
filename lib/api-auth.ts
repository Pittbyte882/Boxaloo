import { NextRequest, NextResponse } from "next/server"

export function checkInternalSecret(request: NextRequest): NextResponse | null {
  const secret = request.headers.get("x-internal-secret")
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}