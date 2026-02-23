import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = await supabase
      .from("posted_trucks")
      .update(body)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error("PATCH /api/trucks/[id] error:", err)
    return NextResponse.json({ error: "Failed to update truck" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabase.from("posted_trucks").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/trucks/[id] error:", err)
    return NextResponse.json({ error: "Failed to delete truck" }, { status: 500 })
  }
}