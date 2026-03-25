import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import { sendDocumentRejectEmail } from "@/lib/email"

const DOC_FIELDS: Record<string, string> = {
  mcLetter: "mc_letter_url",
  insurance: "insurance_url",
  w9: "w9_url",
  noa: "noa_url",
}

const DOC_LABELS: Record<string, string> = {
  mcLetter: "MC Authority Letter",
  insurance: "Certificate of Insurance",
  w9: "W-9 Form",
  noa: "Notice of Assignment",
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { docKey, dispatcherName, dispatcherCompany, dispatcherId } = await request.json()

  if (!docKey || !DOC_FIELDS[docKey]) {
    return NextResponse.json({ error: "Invalid document key" }, { status: 400 })
  }

  // 1. Fetch driver
  const { data: driver, error: fetchError } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 })
  }

  // 2. Clear the document URL on the driver record
  const { error: updateError } = await supabase
    .from("drivers")
    .update({ [DOC_FIELDS[docKey]]: "" })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json({ error: "Failed to clear document" }, { status: 500 })
  }

  // 3. Create a fresh invite token
  const token = `${dispatcherId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  await supabase.from("driver_invites").insert([{
    token,
    dispatcher_id: dispatcherId,
    email: driver.email,
    created_at: new Date().toISOString(),
    used: false,
  }])

  // 4. Email the driver
  await sendDocumentRejectEmail({
    to: driver.email,
    driverName: driver.name,
    dispatcherName: dispatcherName || "Your Dispatcher",
    dispatcherCompany: dispatcherCompany || "Boxaloo",
    docLabel: DOC_LABELS[docKey],
    token,
  })

  return NextResponse.json({ success: true })
}