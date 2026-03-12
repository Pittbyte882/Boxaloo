import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getUserByEmail } from "@/lib/store"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 })
    }

    const subscriptionPriceId = role === "dispatcher"
      ? process.env.STRIPE_DISPATCHER_PRICE_ID!
      : process.env.STRIPE_CARRIER_PRICE_ID!

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      customer_creation: "always",        
      payment_method_collection: "always", 
      line_items: [
        {
          price: process.env.STRIPE_SETUP_FEE_PRICE_ID!,
          quantity: 1,
        },
      ],
      payment_intent_data: {
        setup_future_usage: "off_session", // saves card for future subscription
        metadata: {
          userId: (user as any).id,
          email,
          role,
          subscriptionPriceId,
          type: "setup_fee",
        },
      },
      metadata: {
        userId: (user as any).id,
        email,
        role,
        subscriptionPriceId,
        type: "setup_fee",
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