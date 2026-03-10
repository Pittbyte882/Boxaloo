import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"
import { createUser, getUserByEmail } from "@/lib/store"
import bcrypt from "bcryptjs"
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

  processWebhookEvent(event).catch((err) => {
    console.error("Webhook processing error:", err)
  })

  return NextResponse.json({ received: true })
}

async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.CheckoutSession
      if (session.mode !== "subscription") break

      const meta = session.metadata || {}
      const email = meta.email
      const name = meta.name
      const company = meta.company || ""
      const role = meta.role
      const password = meta.password
      const brokerMc = meta.brokerMc || ""
      const phone = meta.phone || ""
      const fmcsaLegalName = meta.fmcsaLegalName || null
      const fmcsaDotNumber = meta.fmcsaDotNumber || null
      const fmcsaAuthorized = meta.fmcsaAuthorized === "true"

      if (!email || !name || !role || !password) {
        console.error("Missing metadata in checkout session:", session.id)
        break
      }

      // Check if user already exists (idempotency)
      const existing = await getUserByEmail(email)
      if (existing) {
        console.log(`User already exists for ${email}, skipping account creation`)
        // Still update stripe IDs in case they weren't saved
        const customerId = typeof session.customer === "string" ? session.customer : (session.customer as any)?.id
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription as any)?.id
        await supabase
          .from("users")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "trialing",
            active: true,
          })
          .eq("email", email)
        break
      }

      const password_hash = await bcrypt.hash(password, 10)
      const now = new Date()
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + 3)

      const customerId = typeof session.customer === "string" ? session.customer : (session.customer as any)?.id
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription as any)?.id

      try {
        const user = await createUser({
          email,
          password_hash,
          name,
          company,
          role: role as any,
          broker_mc: brokerMc,
          phone,
          active: true,
          trial_ends_at: trialEnd.toISOString(),
          fmcsa_legal_name: fmcsaLegalName,
          fmcsa_dot_number: fmcsaDotNumber,
          fmcsa_authorized: fmcsaAuthorized,
          fmcsa_verified_at: fmcsaAuthorized ? new Date().toISOString() : null,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "trialing",
        })

        console.log(`Account created for ${email} via checkout session ${session.id}`)

        // Send welcome email
        try {
          await sendWelcomeEmail({ to: email, name, role, trialDays: 3 })
        } catch (emailErr) {
          console.error("Welcome email failed:", emailErr)
        }

        // Notify internal team
        try {
          await sendNewSignupNotification({ name, company, email, role, phone })
        } catch (notifyErr) {
          console.error("Signup notification failed:", notifyErr)
        }

      } catch (createErr: any) {
        console.error("Failed to create user from checkout session:", createErr)
      }
      break
    }

    case "invoice.payment_succeeded":
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice
      if (!invoice.customer) break
      try {
        await supabase
          .from("users")
          .update({ active: true, subscription_status: "active" })
          .eq("stripe_customer_id", invoice.customer as string)
      } catch (dbErr) {
        console.error("DB update failed for invoice.paid:", dbErr)
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      if (!invoice.customer) break
      try {
        await supabase
          .from("users")
          .update({ active: false, subscription_status: "past_due" })
          .eq("stripe_customer_id", invoice.customer as string)
      } catch (dbErr) {
        console.error("DB update failed for payment_failed:", dbErr)
      }
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      if (!sub.customer) break
      try {
        await supabase
          .from("users")
          .update({
            subscription_status: sub.status,
            active: sub.status === "active" || sub.status === "trialing",
            stripe_subscription_id: sub.id,
          })
          .eq("stripe_customer_id", sub.customer as string)
      } catch (dbErr) {
        console.error("DB update failed for subscription.updated:", dbErr)
      }
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      if (!sub.customer) break
      try {
        await supabase
          .from("users")
          .update({ active: false, subscription_status: "canceled" })
          .eq("stripe_customer_id", sub.customer as string)
      } catch (dbErr) {
        console.error("DB update failed for subscription.deleted:", dbErr)
      }
      break
    }

    case "customer.subscription.trial_will_end": {
      const sub = event.data.object as Stripe.Subscription
      if (!sub.customer) break
      try {
        await supabase
          .from("users")
          .update({ subscription_status: sub.status, active: true })
          .eq("stripe_customer_id", sub.customer as string)
      } catch (dbErr) {
        console.error("DB update failed for trial_will_end:", dbErr)
      }
      break
    }
  }
}