import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"
import { sendPaymentConfirmationEmail } from "@/lib/email"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentMethodId } = await request.json()

    if (!userId || !paymentMethodId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (userErr || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const amount = user.role === "dispatcher" ? 5500 : 4900 // cents
    const label = user.role === "dispatcher" ? "$55.00" : "$49.00"

    // Attach payment method to customer if needed
    if (user.stripe_customer_id) {
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: user.stripe_customer_id,
        })
      } catch {
        // Already attached — that's fine
      }
    }

    // Create and confirm payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: user.stripe_customer_id || undefined,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      description: `Boxaloo ${user.role} monthly access — ${label}`,
      metadata: { userId, role: user.role, platform: "boxaloo" },
    })

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment failed. Please try a different card." }, { status: 400 })
    }

    // Set access_expires_at to 30 days from now
    const accessExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString()

    await supabase
      .from("users")
      .update({
        active: true,
        access_expires_at: accessExpiresAt,
        subscription_status: "active",
      })
      .eq("id", userId)

    // Send payment confirmation email
    try {
      await sendPaymentConfirmationEmail({
        to: user.email,
        name: user.name,
        role: user.role,
        amount: label,
        accessExpiresAt,
      })
    } catch (err) {
      console.error("Confirmation email failed:", err)
    }

    return NextResponse.json({ success: true, accessExpiresAt })
  } catch (err: any) {
    console.error("Manual payment error:", err)
    return NextResponse.json({ error: err.message || "Payment failed" }, { status: 500 })
  }
}