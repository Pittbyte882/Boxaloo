"use client"

import { useState } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BoxalooWordmark } from "@/components/boxaloo-wordmark"
import { supabase } from "@/lib/store"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://loads.boxaloo.com/reset-password",
      })
      if (error) { setError(error.message); return }
      setSent(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center px-6 py-4 border-b border-border" style={{ borderColor: "rgba(57,255,20,0.08)" }}>
        <a href="/"><BoxalooWordmark size="md" /></a>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-8 shadow-2xl shadow-primary/5">
            {sent ? (
              <div className="text-center py-4">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="size-6 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground mb-2">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to <strong className="text-foreground">{email}</strong>.
                  Click the link in the email to set a new password.
                </p>
                <a href="/" className="inline-block mt-6 text-sm text-primary hover:underline">
                  Back to login
                </a>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground mb-1">Reset your password</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter your email and we'll send you a reset link.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1.5">Email</Label>
                    <Input
                      className="bg-input border-border text-foreground"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                    {!loading && <ArrowRight className="size-4 ml-2" />}
                  </Button>
                  <a href="/" className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Back to login
                  </a>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}