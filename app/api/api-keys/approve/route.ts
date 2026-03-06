import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import { sendApiKeyApprovedEmail } from "@/lib/email"
import { createHash, randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Verify admin session via header
    const adminSecret = request.headers.get("x-admin-secret")
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { applicationId } = await request.json()
    if (!applicationId) {
      return NextResponse.json({ error: "Application ID required" }, { status: 400 })
    }

    // Fetch application
    const { data: app, error: fetchError } = await supabase
      .from("api_key_applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (fetchError || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (app.status === "approved") {
      return NextResponse.json({ error: "Already approved" }, { status: 409 })
    }

    // Generate key: bxl_live_ + 32 random hex chars
    const rawKey = `bxl_live_${randomBytes(16).toString("hex")}`
    const keyHash = createHash("sha256").update(rawKey).digest("hex")
    const keyPrefix = rawKey.slice(0, 16) // bxl_live_xxxxxxx

    // Save key
    const { error: keyError } = await supabase.from("api_keys").insert([{
      application_id: applicationId,
      company_name: app.company_name,
      mc_number: app.mc_number,
      contact_email: app.contact_email,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      can_post: true,
      can_update: true,
      can_delete: true,
      active: true,
    }])

    if (keyError) throw keyError

    // Update application status
    await supabase
      .from("api_key_applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", applicationId)

    // Email broker their key — only time it's ever sent in plain text
    await sendApiKeyApprovedEmail({
      to: app.contact_email,
      contactName: app.contact_name,
      companyName: app.company_name,
      apiKey: rawKey,
    })

    return NextResponse.json({ success: true, keyPrefix })
  } catch (err) {
    console.error("API key approval error:", err)
    return NextResponse.json({ error: "Failed to approve application" }, { status: 500 })
  }
}