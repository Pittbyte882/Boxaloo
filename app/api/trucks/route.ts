import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    let query = supabase.from("posted_trucks").select("*").order("created_at", { ascending: false })
    if (searchParams.get("status")) query = query.eq("status", searchParams.get("status")!)
    if (searchParams.get("postedById")) query = query.eq("posted_by_id", searchParams.get("postedById")!)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error("GET /api/trucks error:", err)
    return NextResponse.json({ error: "Failed to fetch trucks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await supabase.from("posted_trucks").insert([body]).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error("POST /api/trucks error:", err)
    return NextResponse.json({ error: "Failed to post truck" }, { status: 500 })
  }
}