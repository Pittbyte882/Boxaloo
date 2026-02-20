import { NextRequest, NextResponse } from "next/server"
import { getDriverById, updateDriver } from "@/lib/store"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const driver = getDriverById(id)
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 })
  return NextResponse.json(driver)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const updated = updateDriver(id, body)
    if (!updated) return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
