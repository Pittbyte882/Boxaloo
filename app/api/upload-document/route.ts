import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role key bypasses RLS
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const key = formData.get("key") as string
    const driverName = formData.get("driverName") as string
    const dispatcherId = formData.get("dispatcherId") as string

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const ext = file.name.split(".").pop()
    const path = `${dispatcherId}/${driverName.replace(/\s+/g, "-")}-${key}-${Date.now()}.${ext}`
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error } = await supabase.storage
      .from("driver-documents")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data } = supabase.storage.from("driver-documents").getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error("Upload route error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}