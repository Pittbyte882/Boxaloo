import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"
import { sendWelcomeEmail, sendNewSignupNotification } from "@/lib/email"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    await processWebhookEvent(event)
  } catch (err) {
    console.error("Webhook processing error:", err)
  }

  return NextResponse.json({ received: true })
}

async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {

    // ── $5 setup fee paid → activate user with 3 day trial ──
    case "checkout.session.completed": {
      const session = event.data.object as any
      const meta = session.metadata || {}

      if (meta.type !== "setup_fee" || session.mode !== "payment") break

      const { userId, email, role } = meta
      if (!userId || !email) {
        console.error("Missing metadata:", meta)
        break
      }

      const customerId = typeof session.customer === "string"
        ? session.customer
        : session.customer?.id

      const accessExpiresAt = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString()

      // Try update by userId first, fallback to email
      let updatedUser = null
      const { data: byId, error: idErr } = await supabase
        .from("users")
        .update({
          active: true,
          stripe_customer_id: customerId || null,
          subscription_status: "trialing",
          trial_ends_at: accessExpiresAt,
          access_expires_at: accessExpiresAt,
        })
        .eq("id", userId)
        .select()
        .single()

      if (idErr || !byId) {
        const { data: byEmail } = await supabase
          .from("users")
          .update({
            active: true,
            stripe_customer_id: customerId || null,
            subscription_status: "trialing",
            trial_ends_at: accessExpiresAt,
            access_expires_at: accessExpiresAt,
          })
          .eq("email", email)
          .select()
          .single()
        updatedUser = byEmail
      } else {
        updatedUser = byId
      }

      if (!updatedUser) {
        console.error("Failed to activate user for:", email)
        break
      }

      console.log("User activated with 3 day trial:", email)

      try {
        await sendWelcomeEmail({ to: email, name: updatedUser.name, role })
      } catch (err) {
        console.error("Welcome email failed:", err)
      }

      try {
        await sendNewSignupNotification({
          name: updatedUser.name,
          company: updatedUser.company || "",
          email,
          role,
          phone: updatedUser.phone || "",
        })
      } catch (err) {
        console.error("Signup notification failed:", err)
      }

      break
    }
  }
}