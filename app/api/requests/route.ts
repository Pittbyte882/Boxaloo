import { NextRequest, NextResponse } from "next/server"
import { getLoadRequests, createLoadRequest } from "@/lib/store"

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

    return NextResponse.json(req, { status: 201 })
  } catch (err) {
    console.error("POST /api/requests error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}