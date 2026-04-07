"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Loader2, CreditCard, AlertCircle, CheckCircle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CARD_STYLE = {
  style: {
    base: {
      color: "#ffffff",
      fontFamily: "'Courier New', monospace",
      fontSize: "14px",
      "::placeholder": { color: "#555555" },
      backgroundColor: "transparent",
    },
    invalid: { color: "#ff4444" },
  },
}

function PaymentForm({ user }: { user: any }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const amount = user.role === "dispatcher" ? "$55.00" : "$49.00"
  const roleLabel = user.role === "dispatcher" ? "Dispatcher" : "Carrier"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError("")

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      })

      if (pmError) throw new Error(pmError.message)

      // Charge them immediately via manual payment endpoint
      const res = await fetch("/api/stripe/manual-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          paymentMethodId: paymentMethod!.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Payment failed")

      // Update session storage with fresh user data
      const updatedUser = { ...user, active: true, access_expires_at: data.accessExpiresAt }
      sessionStorage.setItem("boxaloo_user", JSON.stringify(updatedUser))
      sessionStorage.removeItem("boxaloo_pending_user")

      setSuccess(true)
      setTimeout(() => {
        router.push(user.role === "carrier" ? "/carrier" : "/dispatcher")
      }, 2000)

    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="size-12 text-primary mx-auto mb-4" />
        <p className="text-foreground font-bold text-lg">Payment successful!</p>
        <p className="text-muted-foreground text-sm mt-2">Redirecting to your dashboard...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-3 rounded-lg text-center"
        style={{ background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.15)" }}>
        <p className="text-sm text-muted-foreground">Amount due today</p>
        <p className="text-3xl font-bold font-mono text-primary">{amount}</p>
        <p className="text-xs text-muted-foreground mt-1">{roleLabel} monthly access · 30 days</p>
      </div>

      <div className="p-4 rounded-lg border"
        style={{ borderColor: "rgba(57,255,20,0.2)", background: "rgba(57,255,20,0.03)" }}>
        <CardElement options={CARD_STYLE} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="size-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={loading || !stripe}
        className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 h-12">
        {loading
          ? <><Loader2 className="size-4 mr-2 animate-spin" /> Processing...</>
          : <><CreditCard className="size-4 mr-2" /> Pay {amount} & Continue</>
        }
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3" />
        <span>Secured by Stripe · Card never stored by Boxaloo</span>
      </div>
    </form>
  )
}

export default function AddPaymentPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_pending_user")
    if (!stored) { router.push("/"); return }
    setUser(JSON.parse(stored))
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
            BOX<span className="text-primary">ALOO</span>
          </span>
          <h1 className="text-xl font-bold text-foreground mt-4 mb-2">
            {user.access_expires_at ? "Access Expired" : "Trial Ended"}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Hi {user.name}, make your payment below to restore access to your {user.role} dashboard.
            Your access will be extended 30 days from today.
          </p>
        </div>

        <div className="p-6 rounded-xl border"
          style={{ borderColor: "rgba(57,255,20,0.15)", background: "#0c0c0f" }}>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
            <CreditCard className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Secure Payment
            </span>
            <span className="ml-auto text-xs text-muted-foreground">Powered by Stripe</span>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm user={user} />
          </Elements>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          You will be reminded before your next payment is due. You must log in and pay manually every 30 days.
        </p>
      </div>
    </div>
  )
}