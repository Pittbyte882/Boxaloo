import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, name, company, role, password, brokerMc, phone, fmcsaLegalName, fmcsaDotNumber, fmcsaAuthorized } = await request.json()

    if (!email || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const priceId = role === "dispatcher"
      ? process.env.STRIPE_DISPATCHER_PRICE_ID!
      : process.env.STRIPE_CARRIER_PRICE_ID!

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      payment_method_collection: "required",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 3,
        metadata: { role, platform: "boxaloo" },
      },
      metadata: {
        email,
        name,
        company: company || "",
        role,
        password,
        brokerMc: brokerMc || "",
        phone: phone || "",
        fmcsaLegalName: fmcsaLegalName || "",
        fmcsaDotNumber: fmcsaDotNumber || "",
        fmcsaAuthorized: fmcsaAuthorized ? "true" : "false",
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