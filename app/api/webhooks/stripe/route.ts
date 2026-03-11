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

    // ── $5 setup fee paid → create subscription ──
    case "checkout.session.completed": {
      const session = event.data.object as any
      const meta = session.metadata || {}

      console.log("=== CHECKOUT SESSION COMPLETED ===")
      console.log("Type:", meta.type, "Mode:", session.mode)
      console.log("Metadata:", JSON.stringify(meta))

      // Handle $5 setup fee payment
      if (meta.type === "setup_fee" && session.mode === "payment") {
        const userId = meta.userId
        const email = meta.email
        const role = meta.role
        const subscriptionPriceId = meta.subscriptionPriceId

        if (!userId || !email || !subscriptionPriceId) {
          console.error("Missing metadata for setup fee:", meta)
          break
        }

        const customerId = typeof session.customer === "string"
          ? session.customer
          : session.customer?.id

        if (!customerId) {
          console.error("No customer ID in session")
          break
        }

        // Get the saved payment method from the payment intent
        const paymentIntentId = session.payment_intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        const paymentMethodId = paymentIntent.payment_method as string

        if (!paymentMethodId) {
          console.error("No payment method found on payment intent")
          break
        }

        // Set as default payment method on customer
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        })

        // Create subscription with 3-day trail 
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: subscriptionPriceId }],
          trial_period_days: 3,
          default_payment_method: paymentMethodId,
          metadata: { userId, role, platform: "boxaloo" },
        })

        console.log("Subscription created:", subscription.id)

        // Activate user in Supabase
        const { data: updatedUser, error: updateErr } = await supabase
          .from("users")
          .update({
            active: true,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscription_status: "trialing",
            trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", userId)
          .select()
          .single()

        console.log("User activation result:", JSON.stringify(updatedUser), "Error:", JSON.stringify(updateErr))

        if (updateErr || !updatedUser) {
          // Fallback to email
          const { data: fallbackUser, error: fallbackErr } = await supabase
            .from("users")
            .update({
              active: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_status: "trialing",
              trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq("email", email)
            .select()
            .single()

          console.log("Fallback result:", JSON.stringify(fallbackUser), "Error:", JSON.stringify(fallbackErr))

          if (fallbackErr || !fallbackUser) {
            console.error("Both activation attempts failed")
            break
          }
        }

        console.log("User activated successfully for:", email)

        // Send welcome email
        try {
          await sendWelcomeEmail({
            to: email,
            name: updatedUser?.name || email,
            role,
            
          })
        } catch (emailErr) {
          console.error("Welcome email failed:", emailErr)
        }

        try {
          await sendNewSignupNotification({
            name: updatedUser?.name || email,
            company: updatedUser?.company || "",
            email,
            role,
            phone: updatedUser?.phone || "",
          })
        } catch (notifyErr) {
          console.error("Signup notification failed:", notifyErr)
        }
        break
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