import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import { sendApiKeyApplicationNotification } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company_name, legal_name, mc_number, website,
      monthly_load_volume, tms_software, reason_for_access,
      has_dev_team, heard_about_us,
      contact_name, contact_email, contact_phone,
      fmcsa_legal_name, fmcsa_authorized,
    } = body

    // Basic validation
    if (!company_name || !mc_number || !contact_name || !contact_email || !reason_for_access) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for duplicate application
    const { data: existing } = await supabase
      .from("api_key_applications")
      .select("id, status")
      .eq("mc_number", mc_number)
      .in("status", ["pending", "approved"])
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: existing.status === "approved"
            ? "An API key already exists for this MC number."
            : "An application for this MC number is already pending review." },
        { status: 409 }
      )
    }

    // Save application
    const { error } = await supabase.from("api_key_applications").insert([{
      company_name, legal_name, mc_number, website,
      monthly_load_volume, tms_software, reason_for_access,
      has_dev_team, heard_about_us,
      contact_name, contact_email, contact_phone,
      fmcsa_legal_name, fmcsa_authorized,
      status: "pending",
    }])

    if (error) throw error

    // Notify admin
    await sendApiKeyApplicationNotification({
      companyName: company_name,
      contactName: contact_name,
      contactEmail: contact_email,
      mcNumber: mc_number,
      monthlyVolume: monthly_load_volume,
      reason: reason_for_access,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("API key application error:", err)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}