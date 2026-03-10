import { NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/store"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/store"
import { sendWelcomeEmail, sendNewSignupNotification } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email, password, name, company, role, brokerMc, phone,
      fmcsaLegalName, fmcsaDotNumber, fmcsaAuthorized,
    } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    if ((role === "broker" || role === "carrier") && !brokerMc) {
      return NextResponse.json({ error: "MC# is required" }, { status: 400 })
    }

    if ((role === "broker" || role === "carrier") && brokerMc) {
      if (!/^\d+$/.test(brokerMc)) {
        return NextResponse.json({ error: "MC# must be numbers only" }, { status: 400 })
      }
    }

    if ((role === "broker" || role === "carrier") && !fmcsaAuthorized) {
      return NextResponse.json({ error: "MC# must be verified with FMCSA before creating an account" }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const now = new Date()
    let trial_ends_at: string | null = null
    let trialDays = 0

    if (role === "dispatcher" || role === "carrier") {
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + 3)
      trial_ends_at = trialEnd.toISOString()
      trialDays = 3
    }

    // Carriers and dispatchers start INACTIVE — activated by webhook after payment
    const active = role === "broker" ? true : false

    const user = await createUser({
      email,
      password_hash,
      name,
      company: company || "",
      role: role as UserRole,
      broker_mc: brokerMc || "",
      phone: phone || "",
      active,
      trial_ends_at,
      fmcsa_legal_name: fmcsaLegalName || null,
      fmcsa_dot_number: fmcsaDotNumber || null,
      fmcsa_authorized: fmcsaAuthorized || false,
      fmcsa_verified_at: fmcsaAuthorized ? new Date().toISOString() : null,
    })

    // Only send welcome email for brokers — carriers/dispatchers get it after payment
    if (role === "broker") {
      try {
        await sendWelcomeEmail({ to: email, name, role, trialDays })
      } catch (emailErr) {
        console.error("Welcome email failed:", emailErr)
      }
      try {
        await sendNewSignupNotification({ name, company: company || "", email, role, phone: phone || "" })
      } catch (notifyErr: any) {
        console.error("Signup notification failed:", notifyErr)
      }
    }

    const { password_hash: _, ...safeUser } = user
    return NextResponse.json({ user: safeUser }, { status: 201 })
  } catch (err) {
    console.error("Signup error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}