import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getUserByEmail } from "@/lib/store"
import bcrypt from "bcryptjs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, name, company, role, brokerMc, phone, fmcsaLegalName, fmcsaDotNumber, fmcsaAuthorized } = await request.json()

    if (!email || !role){
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Account must already exist (created inactive by signup route)
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Account not found. Please try signing up again." }, { status: 404 })
    }

    const priceId = role === "dispatcher"
      ? process.env.STRIPE_DISPATCHER_PRICE_ID!
      : process.env.STRIPE_CARRIER_PRICE_ID!

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      payment_method_collection: "always",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 3,
        metadata: { role, platform: "boxaloo" },
      },
      // Only pass email and userId — NO PASSWORD
      metadata: {
        userId: (user as any).id,
        email,
        role,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("Checkout session error:", err)
    return NextResponse.json({ error: err.message || "Failed to create checkout session" }, { status: 500 })
  }
}