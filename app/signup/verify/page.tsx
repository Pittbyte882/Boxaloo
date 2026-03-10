"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, ArrowRight, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BoxalooWordmark } from "@/components/boxaloo-wordmark"
import { cn } from "@/lib/utils"

export default function SignupVerifyPage() {
  const router = useRouter()
  const [pendingUser, setPendingUser] = useState<any>(null)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [resent, setResent] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_pending_otp")
    if (!stored) { router.push("/"); return }
    setPendingUser(JSON.parse(stored))
  }, [router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setError("Please enter the 6-digit code."); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingUser.email, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Invalid code."); return }

      sessionStorage.removeItem("boxaloo_pending_otp")
      sessionStorage.setItem("boxaloo_user", JSON.stringify(pendingUser))

      const role = pendingUser.role
      if (role === "carrier") window.location.href = "/carrier"
      else if (role === "dispatcher") window.location.href = "/dispatcher"
      else window.location.href = "/"
    } catch {
      setError("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setResent(false)
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingUser.email, name: pendingUser.name }),
      })
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  if (!pendingUser) {
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
          <BoxalooWordmark size="lg" className="mx-auto mb-6" />
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="size-6 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground mb-1">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <strong className="text-foreground">{pendingUser.email}</strong>
          </p>
        </div>

        <div className="rounded-xl border p-6" style={{ borderColor: "rgba(57,255,20,0.15)", background: "#0c0c0f" }}>
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5">Verification Code</Label>
              <Input
                className="bg-input border-border text-foreground font-mono text-center text-2xl tracking-[0.5em] h-14"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {error && <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
            {resent && <p className="text-[12px] text-green-400 bg-green-400/10 rounded-lg px-3 py-2">Code resent! Check your inbox.</p>}

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90"
            >
              {loading ? "Verifying..." : "Verify Email"}
              {!loading && <ArrowRight className="size-4 ml-2" />}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              <RefreshCw className={cn("size-3", resending && "animate-spin")} />
              {resending ? "Sending..." : "Resend code"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}