import { NextRequest, NextResponse } from "next/server"
import { updateLoadRequest, getLoadById, getUserByEmail } from "@/lib/store"
import { sendRequestAcceptedEmail, sendRequestDeclinedEmail } from "@/lib/email"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const updated = await updateLoadRequest(id, body)
    if (!updated) return NextResponse.json({ error: "Request not found" }, { status: 404 })

    // Send email if status changed to accepted or declined
    if (body.status === "accepted" || body.status === "declined") {
      try {
        const load = await getLoadById(updated.load_id)
        if (load && updated.company_name) {
          const route = `${load.pickup_city}, ${load.pickup_state} → ${load.dropoff_city}, ${load.dropoff_state}`

          // Find the requester's email — they put their email in the request
          // We'll use company_name to look up or use a passed email field
          if (body.requester_email) {
            if (body.status === "accepted") {
              await sendRequestAcceptedEmail({
                to: body.requester_email,
                name: updated.driver_name || updated.company_name,
                loadId: load.id,
                route,
                payRate: load.pay_rate,
                pickupDate: load.pickup_date,
                dropoffDate: load.dropoff_date,
                brokerName: load.broker_name,
                brokerMc: load.broker_mc,
              })
            } else {
              await sendRequestDeclinedEmail({
                to: body.requester_email,
                name: updated.driver_name || updated.company_name,
                loadId: load.id,
                route,
              })
            }
          }
        }
      } catch (emailErr) {
        console.error("Request status email failed:", emailErr)
      }
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error("PATCH /api/requests/[id] error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}