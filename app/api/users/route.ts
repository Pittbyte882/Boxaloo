import { NextRequest, NextResponse } from "next/server"
import { getUsers, createUser } from "@/lib/store"
import type { UserRole } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const users = await getUsers({
      role: searchParams.get("role") || undefined,
      search: searchParams.get("search") || undefined,
    })
    return NextResponse.json(users)
  } catch (err) {
    console.error("GET /api/users error:", err)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, company, active, broker_mc, trial_ends_at, password_hash } = body

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await createUser({
      name,
      email,
      password_hash: password_hash || "",
      role: role as UserRole,
      company: company || "",
      active: active ?? true,
      broker_mc: broker_mc || "",
      trial_ends_at: trial_ends_at || null,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error("POST /api/users error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}