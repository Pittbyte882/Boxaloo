import { NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/store"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, company, role, brokerMc } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if email already exists
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Set trial period
    const now = new Date()
    let trial_ends_at: string | null = null
    if (role === "broker") {
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + 30)
      trial_ends_at = trialEnd.toISOString()
    } else if (role === "dispatcher" || role === "carrier") {
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + 3)
      trial_ends_at = trialEnd.toISOString()
    }

    const user = await createUser({
      email,
      password_hash,
      name,
      company: company || "",
      role: role as UserRole,
      broker_mc: brokerMc || "",
      active: true,
      trial_ends_at,
    })

    const { password_hash: _, ...safeUser } = user

    return NextResponse.json({ user: safeUser }, { status: 201 })
  } catch (err) {
    console.error("Signup error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
