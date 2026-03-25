import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, company, mc, dot, phone, email, equipmentType,
      dispatcher_id, token,
      mc_letter_url, insurance_url, w9_url, noa_url,
    } = body

    if (!name || !company || !mc || !dot || !phone || !equipmentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!mc_letter_url || !insurance_url || !w9_url) {
      return NextResponse.json({ error: "Required documents missing" }, { status: 400 })
    }

    // ✅ Check if driver with this email already exists
    const { data: existing } = await supabase
      .from("drivers")
      .select("id")
      .eq("email", email)
      .single()

    let driver, error

    if (existing) {
      // ✅ Update existing record instead of creating a duplicate
      ;({ data: driver, error } = await supabase
        .from("drivers")
        .update({
          name,
          company,
          mc_number: mc,
          dot_number: dot,
          phone,
          equipment_type: equipmentType,
          mc_letter_url,
          insurance_url,
          w9_url,
          noa_url: noa_url || null,
          onboarded: true,
        })
        .eq("id", existing.id)
        .select()
        .single())
    } else {
      // ✅ New driver — insert as before
      ;({ data: driver, error } = await supabase
        .from("drivers")
        .insert([{
          dispatcher_id,
          email,
          name,
          company,
          mc_number: mc,
          dot_number: dot,
          phone,
          equipment_type: equipmentType,
          mc_letter_url,
          insurance_url,
          w9_url,
          noa_url: noa_url || null,
          onboarded: true,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single())
    }

    if (error) {
      console.error("Driver save error:", JSON.stringify(error))
      return NextResponse.json({ error: error.message, detail: JSON.stringify(error) }, { status: 500 })
    }

    // Mark invite token as used
    if (token) {
      await supabase
        .from("driver_invites")
        .update({ used: true })
        .eq("token", token)
    }

    return NextResponse.json(driver, { status: 201 })
  } catch (err) {
    console.error("Onboarding error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}