import { NextRequest, NextResponse } from "next/server"
import { getLoadRequests, createLoadRequest, getLoadById, getUserByEmail } from "@/lib/store"
import { sendLoadRequestEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const requests = await getLoadRequests({
      loadId: searchParams.get("loadId") || undefined,
      status: searchParams.get("status") || undefined,
    })
    return NextResponse.json(requests)
  } catch (err) {
    console.error("GET /api/requests error:", err)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      load_id, loadId,
      requester_type, type,
      driver_name, driverName,
      company_name, companyName,
      mc_number, mc,
      phone,
      truck_type, truckType,
      truck_number, truckNumber,
      truck_location, currentLocation,
      counter_offer, counterOfferPrice,
      dispatcher_name, dispatcherName,
      dispatcher_phone, dispatcherPhone,
    } = body

    const resolvedLoadId = load_id || loadId
    const resolvedDriverName = driver_name || driverName
    const resolvedCompanyName = company_name || companyName
    const resolvedMc = mc_number || mc
    const resolvedTruckType = truck_type || truckType
    const resolvedTruckNumber = truck_number || truckNumber
    const resolvedLocation = truck_location || currentLocation

    if (!resolvedLoadId || !resolvedDriverName || !resolvedCompanyName || !resolvedMc || !phone || !resolvedTruckType || !resolvedTruckNumber || !resolvedLocation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const req = await createLoadRequest({
      load_id: resolvedLoadId,
      requester_type: requester_type || type || "carrier",
      driver_name: resolvedDriverName,
      company_name: resolvedCompanyName,
      mc_number: resolvedMc,
      phone,
      truck_type: resolvedTruckType,
      truck_number: resolvedTruckNumber,
      truck_location: resolvedLocation,
      counter_offer: counter_offer || counterOfferPrice || null,
      dispatcher_name: dispatcher_name || dispatcherName || "",
      dispatcher_phone: dispatcher_phone || dispatcherPhone || "",
      status: "pending",
    })

    // Email the broker that a new request came in
    try {
      const load = await getLoadById(resolvedLoadId)
      if (load) {
        const broker = await getUserByEmail(load.broker_id)
        // broker_id is a user ID not email — look up by id instead
        const { supabase } = await import("@/lib/store")
        const { data: brokerUser } = await supabase
          .from("users")
          .select("email, name")
          .eq("id", load.broker_id)
          .single()

        if (brokerUser) {
          const route = `${load.pickup_city}, ${load.pickup_state} → ${load.dropoff_city}, ${load.dropoff_state}`
          await sendLoadRequestEmail({
            to: brokerUser.email,
            brokerName: brokerUser.name,
            requesterName: resolvedDriverName,
            requesterCompany: resolvedCompanyName,
            requesterType: requester_type || type || "carrier",
            loadId: load.id,
            route,
            payRate: load.pay_rate,
          })
        }
      }
    } catch (emailErr) {
      console.error("Load request email failed:", emailErr)
    }

    return NextResponse.json(req, { status: 201 })
  } catch (err) {
    console.error("POST /api/requests error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}