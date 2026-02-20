import { NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/store"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/store"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, company, role, brokerMc } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const now = new Date()
    let trial_ends_at: string | null = null
    let trialDays = 0
    if (role === "broker") {
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + 30)
      trial_ends_at = trialEnd.toISOString()
      trialDays = 30
    } else if (role === "dispatcher" || role === "carrier") {
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + 3)
      trial_ends_at = trialEnd.toISOString()
      trialDays = 3
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

    // Send welcome email — don't block signup if it fails
    try {
      await sendWelcomeEmail({ to: email, name, role, trialDays })
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr)
    }

    const { password_hash: _, ...safeUser } = user
    return NextResponse.json({ user: safeUser }, { status: 201 })
  } catch (err) {
    console.error("Signup error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}