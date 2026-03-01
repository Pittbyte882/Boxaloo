"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BoxalooWordmark } from "@/components/boxaloo-wordmark"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (password !== confirm) { setError("Passwords do not match."); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setError(error.message); return }
      setDone(true)
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
            {done ? (
              <div className="text-center py-4">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="size-6 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground mb-2">Password updated!</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Your password has been reset. You can now log in with your new password.
                </p>
                <a href="/" className="inline-block bg-primary text-primary-foreground font-bold uppercase tracking-wider px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  Go to Login
                </a>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground mb-1">Set new password</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose a strong password for your account.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1.5">New Password</Label>
                    <Input
                      className="bg-input border-border text-foreground"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1.5">Confirm Password</Label>
                    <Input
                      className="bg-input border-border text-foreground"
                      type="password"
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90"
                  >
                    {loading ? "Updating..." : "Update Password"}
                    {!loading && <ArrowRight className="size-4 ml-2" />}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}