import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getUserByEmail } from "@/lib/store"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 })

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    })

    if (session.status !== "complete") {
      return NextResponse.json({ error: "Session not complete" }, { status: 400 })
    }

    const email = session.metadata?.email
    if (!email) return NextResponse.json({ error: "No email in session" }, { status: 400 })

    // Check if account was already created by webhook
    const existing = await getUserByEmail(email)
    if (existing) {
      const { password_hash, ...safeUser } = existing as any
      return NextResponse.json({ user: safeUser, alreadyCreated: true })
    }

    // Webhook hasn't fired yet — return session data so success page can poll
    return NextResponse.json({
      pending: true,
      email,
      customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
      subscriptionId: typeof session.subscription === "string" ? session.subscription : (session.subscription as any)?.id,
    })
  } catch (err: any) {
    console.error("Verify session error:", err)
    return NextResponse.json({ error: err.message || "Failed to verify session" }, { status: 500 })
  }
}