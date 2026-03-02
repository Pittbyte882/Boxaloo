import { NextRequest, NextResponse } from "next/server"
import { getDrivers, createDriver } from "@/lib/store"

import { checkInternalSecret } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const authError = checkInternalSecret(request)
  if (authError) return authError
  try {
    const { searchParams } = request.nextUrl
    const dispatcherId = searchParams.get("dispatcherId") || undefined
    const drivers = await getDrivers(dispatcherId)
    return NextResponse.json(drivers)
  } catch (err) {
    console.error("GET /api/drivers error:", err)
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      dispatcher_id, dispatcherId,
      name, company, email,
      mc_number, mc,
      dot_number, dot,
      equipment_type, equipmentType,
    } = body

    const resolvedMc = mc_number || mc || ""
    const resolvedDot = dot_number || dot || ""
    const resolvedEquipment = equipment_type || equipmentType || ""
    const resolvedDispatcherId = dispatcher_id || dispatcherId || ""

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const driver = await createDriver({
      dispatcher_id: resolvedDispatcherId,
      name: name || "",
      company: company || "",
      email,
      mc_number: resolvedMc,
      dot_number: resolvedDot,
      equipment_type: resolvedEquipment,
      mc_letter_url: "",
      insurance_url: "",
      w9_url: "",
      noa_url: "",
      onboarded: false,
    })

    return NextResponse.json(driver, { status: 201 })
  } catch (err) {
    console.error("POST /api/drivers error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}