import { NextRequest, NextResponse } from "next/server"
import { updateLoadRequest } from "@/lib/store"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const updated = await updateLoadRequest(id, body)
    if (!updated) return NextResponse.json({ error: "Request not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("PATCH /api/requests/[id] error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}