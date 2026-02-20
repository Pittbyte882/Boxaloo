import { NextRequest, NextResponse } from "next/server"
import { getUserById, updateUser } from "@/lib/store"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUserById(id)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const updated = await updateUser(id, body)
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("PATCH /api/users/[id] error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}