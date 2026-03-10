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

  // Wait for processing — this way errors show in logs
  try {
    await processWebhookEvent(event)
  } catch (err) {
    console.error("Webhook processing error:", err)
  }

  return NextResponse.json({ received: true })
}
async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object as any
      console.log("=== CHECKOUT SESSION COMPLETED ===")
      console.log("Session ID:", session.id)
      console.log("Mode:", session.mode)
      console.log("Metadata:", JSON.stringify(session.metadata))
      console.log("Customer:", session.customer)
      console.log("Subscription:", session.subscription)

      if (session.mode !== "subscription") {
        console.log("Not a subscription, skipping")
        break
      }

      const meta = session.metadata || {}
      const userId = meta.userId
      const email = meta.email
      const role = meta.role

      console.log("UserId:", userId, "Email:", email, "Role:", role)

      if (!userId && !email) {
        console.error("Missing userId and email in metadata")
        break
      }

      const customerId = typeof session.customer === "string"
        ? session.customer
        : session.customer?.id

      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id

      console.log("Updating user with customerId:", customerId, "subscriptionId:", subscriptionId)

      const { data: updatedUser, error: updateErr } = await supabase
        .from("users")
        .update({
          active: true,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "trialing",
          trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      console.log("Update result - updatedUser:", JSON.stringify(updatedUser), "error:", JSON.stringify(updateErr))

      if (updateErr || !updatedUser) {
        console.error("Failed to activate user by ID, trying email fallback")
        const { data: fallbackUser, error: fallbackErr } = await supabase
          .from("users")
          .update({
            active: true,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "trialing",
            trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("email", email)
          .select()
          .single()

        console.log("Fallback result - user:", JSON.stringify(fallbackUser), "error:", JSON.stringify(fallbackErr))

        if (fallbackErr || !fallbackUser) {
          console.error("Both update attempts failed")
          break
        }
      }

      console.log("User activated successfully")

      // Send welcome email
      const userToNotify = updatedUser || {}
      try {
        await sendWelcomeEmail({
          to: email,
          name: (userToNotify as any).name || email,
          role: role,
          trialDays: 3,
        })
      } catch (emailErr) {
        console.error("Welcome email failed:", emailErr)
      }

      try {
        await sendNewSignupNotification({
          name: (userToNotify as any).name || email,
          company: (userToNotify as any).company || "",
          email,
          role,
          phone: (userToNotify as any).phone || "",
        })
      } catch (notifyErr) {
        console.error("Signup notification failed:", notifyErr)
      }
      break
    }

    case "invoice.payment_succeeded":
    case "invoice.paid": {
      const invoice = event.data.object as any
      if (!invoice.customer) break
      try {
        await supabase
          .from("users")
          .update({ active: true, subscription_status: "active" })
          .eq("stripe_customer_id", invoice.customer)
      } catch (dbErr) {
        console.error("DB update failed for invoice.paid:", dbErr)
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any
      if (!invoice.customer) break
      try {
        await supabase
          .from("users")
          .update({ active: false, subscription_status: "past_due" })
          .eq("stripe_customer_id", invoice.customer)
      } catch (dbErr) {
        console.error("DB update failed for payment_failed:", dbErr)
      }
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as any
      if (!sub.customer) break
      try {
        await supabase
          .from("users")
          .update({
            subscription_status: sub.status,
            active: sub.status === "active" || sub.status === "trialing",
            stripe_subscription_id: sub.id,
          })
          .eq("stripe_customer_id", sub.customer)
      } catch (dbErr) {
        console.error("DB update failed for subscription.updated:", dbErr)
      }
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as any
      if (!sub.customer) break
      try {
        await supabase
          .from("users")
          .update({ active: false, subscription_status: "canceled" })
          .eq("stripe_customer_id", sub.customer)
      } catch (dbErr) {
        console.error("DB update failed for subscription.deleted:", dbErr)
      }
      break
    }

    case "customer.subscription.trial_will_end": {
      const sub = event.data.object as any
      if (!sub.customer) break
      try {
        await supabase
          .from("users")
          .update({ subscription_status: sub.status, active: true })
          .eq("stripe_customer_id", sub.customer)
      } catch (dbErr) {
        console.error("DB update failed for trial_will_end:", dbErr)
      }
      break
    }
  }
}