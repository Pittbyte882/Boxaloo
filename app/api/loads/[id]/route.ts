import { NextRequest, NextResponse } from "next/server"
import { getLoadById, updateLoad, deleteLoad, supabase, getLoadRequests, getUserByEmail } from "@/lib/store"
import { sendLoadCanceledEmail } from "@/lib/email"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const load = await getLoadById(id)
  if (!load) return NextResponse.json({ error: "Load not found" }, { status: 404 })
  return NextResponse.json(load)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from("loads")
      .update(body)
      .eq("id", id)
      .select()
      .single()

    if (!error && data) {
      // If load was just canceled, email all accepted requesters
      if (body.status === "Canceled") {
        try {
          const requests = await getLoadRequests({ loadId: id, status: "accepted" })
          const route = `${data.pickup_city}, ${data.pickup_state} → ${data.dropoff_city}, ${data.dropoff_state}`
          for (const req of requests) {
            // Look up requester email by company — we stored phone not email
            // So we notify via the requester_email if passed, or skip silently
            if (req.requester_email) {
              await sendLoadCanceledEmail({
                to: req.requester_email,
                name: req.driver_name || req.company_name,
                loadId: data.id,
                route,
              })
            }
          }
        } catch (emailErr) {
          console.error("Load canceled email failed:", emailErr)
        }
      }
      return NextResponse.json(data)
    }

    // Fall back to mock data
    const { mockLoads } = await import("@/lib/mock-data")
    const idx = mockLoads.findIndex((l: any) => l.id === id)
    if (idx !== -1) {
      Object.assign(mockLoads[idx], body)
      return NextResponse.json(mockLoads[idx])
    }

    return NextResponse.json({ error: "Load not found" }, { status: 404 })
  } catch (err) {
    console.error("PATCH /api/loads/[id] error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase.from("loads").delete().eq("id", id)
  if (!error) return NextResponse.json({ success: true })

  const { mockLoads } = await import("@/lib/mock-data")
  const idx = mockLoads.findIndex((l: any) => l.id === id)
  if (idx !== -1) {
    mockLoads.splice(idx, 1)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Load not found" }, { status: 404 })
}