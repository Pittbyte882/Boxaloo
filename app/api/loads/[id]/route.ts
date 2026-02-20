import { NextRequest, NextResponse } from "next/server"
import { getLoadById, updateLoad, deleteLoad, supabase } from "@/lib/store"

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

    // Try Supabase update first
    const { data, error } = await supabase
      .from("loads")
      .update(body)
      .eq("id", id)
      .select()
      .single()

    if (!error && data) {
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

  // Try Supabase delete first
  const { error } = await supabase
    .from("loads")
    .delete()
    .eq("id", id)

  if (!error) {
    return NextResponse.json({ success: true })
  }

  // Fall back to mock data
  const { mockLoads } = await import("@/lib/mock-data")
  const idx = mockLoads.findIndex((l: any) => l.id === id)
  if (idx !== -1) {
    mockLoads.splice(idx, 1)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Load not found" }, { status: 404 })
}