import { NextRequest, NextResponse } from "next/server"
import { getUserById } from "@/lib/store"

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("boxaloo_session")
    if (!session?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getUserById(session.value)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { password_hash, ...safeUser } = user as any
    return NextResponse.json(safeUser)
  } catch (err) {
    console.error("GET /api/auth/me error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}