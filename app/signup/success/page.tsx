"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { BoxalooWordmark } from "@/components/boxaloo-wordmark"

export default function SignupSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "sending_otp" | "error">("loading")
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")

  useEffect(() => {
    if (!sessionId) {
      router.push("/")
      return
    }

    let attempts = 0
    const maxAttempts = 10

    async function pollForAccount() {
      try {
        const res = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Something went wrong.")
          setStatus("error")
          return
        }

        if (data.pending && attempts < maxAttempts) {
          // Webhook hasn't fired yet — poll again in 2 seconds
          attempts++
          setTimeout(pollForAccount, 2000)
          return
        }

        if (data.pending && attempts >= maxAttempts) {
          setError("Account setup is taking longer than expected. Please check your email or contact support.")
          setStatus("error")
          return
        }

        // Account exists — send OTP and go to verify
        setEmail(data.user.email)
        setName(data.user.name)
        setStatus("sending_otp")

        await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.user.email, name: data.user.name }),
        })

        // Store pending user and redirect to OTP page
        sessionStorage.setItem("boxaloo_pending_otp", JSON.stringify(data.user))
        router.push("/signup/verify")

      } catch (err) {
        setError("Network error. Please try again.")
        setStatus("error")
      }
    }

    pollForAccount()
  }, [sessionId, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <BoxalooWordmark size="lg" />
        </div>

        {status === "loading" && (
          <div>
            <Loader2 className="size-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-foreground font-bold text-lg mb-2">Setting up your account...</p>
            <p className="text-muted-foreground text-sm">Please wait while we confirm your payment and create your account.</p>
          </div>
        )}

        {status === "sending_otp" && (
          <div>
            <CheckCircle className="size-12 text-primary mx-auto mb-4" />
            <p className="text-foreground font-bold text-lg mb-2">Payment confirmed!</p>
            <p className="text-muted-foreground text-sm">Sending verification code to {email}...</p>
          </div>
        )}

        {status === "error" && (
          <div>
            <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-bold text-lg mb-2">Something went wrong</p>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <a
              href="/"
              className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm"
            >
              Back to Home
            </a>
          </div>
        )}
      </div>
    </div>
  )
}