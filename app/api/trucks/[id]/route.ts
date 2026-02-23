import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { data, error } = await supabase
      .from("posted_trucks")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error("PATCH /api/trucks/[id] error:", err)
    return NextResponse.json({ error: "Failed to update truck" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("posted_trucks").delete().eq("id", params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/trucks/[id] error:", err)
    return NextResponse.json({ error: "Failed to delete truck" }, { status: 500 })
  }
}