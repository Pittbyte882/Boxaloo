import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const adminSecret = request.headers.get("x-admin-secret")
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { keyId, reason } = await request.json()
    if (!keyId) return NextResponse.json({ error: "Key ID required" }, { status: 400 })

    const { error } = await supabase
      .from("api_keys")
      .update({
        active: false,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason || "Revoked by admin",
      })
      .eq("id", keyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Revoke error:", err)
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 })
  }
}