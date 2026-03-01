import { NextRequest, NextResponse } from "next/server"
import { getLoads, createLoad } from "@/lib/store"
import type { LoadStatus, EquipmentType } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const loads = await getLoads({
      search: searchParams.get("search") || undefined,
      equipmentType: searchParams.get("equipmentType") || undefined,
      status: searchParams.get("status") || undefined,
      brokerId: searchParams.get("brokerId") || undefined,
      minPay: searchParams.get("minPay") ? Number(searchParams.get("minPay")) : undefined,
      maxPay: searchParams.get("maxPay") ? Number(searchParams.get("maxPay")) : undefined,
      maxWeight: searchParams.get("maxWeight") ? Number(searchParams.get("maxWeight")) : undefined,
      pickupState: searchParams.get("pickupState") || undefined,
      dropoffState: searchParams.get("dropoffState") || undefined,
    })
    return NextResponse.json(loads)
  } catch (err) {
    console.error("GET /api/loads error:", err)
    return NextResponse.json({ error: "Failed to fetch loads" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pickupCity, pickup_city,
      pickupState, pickup_state,
      dropoffCity, dropoff_city,
      dropoffState, dropoff_state,
      totalMiles, total_miles,
      equipmentType, equipment_type,
      load_type,
      weight, details, payRate, pay_rate,
      brokerMC, broker_mc,
      brokerId, broker_id,
      brokerName, broker_name,
      pickup_date,    
      dropoff_date,
    } = body as any

    const resolvedPickupCity = pickupCity || pickup_city
    const resolvedDropoffCity = dropoffCity || dropoff_city
    const resolvedEquipmentType = equipmentType || equipment_type
    const resolvedPayRate = payRate || pay_rate

    if (!resolvedPickupCity || !resolvedDropoffCity || !resolvedEquipmentType || !resolvedPayRate) {
      return NextResponse.json({
        error: "Missing required fields",
        received: { resolvedPickupCity, resolvedDropoffCity, resolvedEquipmentType, resolvedPayRate }
      }, { status: 400 })
    }

    const load = await createLoad({
      pickup_city: resolvedPickupCity,
      pickup_state: pickupState || pickup_state || "",
      dropoff_city: resolvedDropoffCity,
      dropoff_state: dropoffState || dropoff_state || "",
      pickup_date: pickup_date || null,    
      dropoff_date: dropoff_date || null,
      total_miles: totalMiles || total_miles || 0,
      equipment_type: resolvedEquipmentType as EquipmentType,
      load_type: load_type || null,
      weight: weight || 0,
      details: details || "",
      pay_rate: resolvedPayRate,
      broker_mc: brokerMC || broker_mc || "",
      broker_id: brokerId || broker_id || null,
      broker_name: brokerName || broker_name || "",
      status: "Available" as LoadStatus,
    })

    return NextResponse.json(load, { status: 201 })
  } catch (err) {
    console.error("POST /api/loads error:", err)
    return NextResponse.json({ error: "Invalid request body", detail: String(err) }, { status: 400 })
  }
}