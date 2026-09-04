import { NextRequest, NextResponse } from "next/server"
import { createLoad, getLoads, supabase } from "@/lib/store"
import type { EquipmentType, LoadStatus } from "@/lib/mock-data"
import { checkInternalSecret } from "@/lib/api-auth"

// ── Rate limiting ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(keyId: string, limit: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(keyId)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(keyId, { count: 1, reset: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// ── API key authentication ───────────────────────────────────────────────────
async function authenticateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const rawKey = authHeader.replace("Bearer ", "").trim()
  const { createHash } = await import("crypto")
  const keyHash = createHash("sha256").update(rawKey).digest("hex")

  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("active", true)
    .maybeSingle()

  if (!keyRecord) return null

  const limit = keyRecord.rate_limit || 100
  if (!checkRateLimit(keyRecord.id, limit)) return "rate_limited"

  // Update usage stats
  await supabase
    .from("api_keys")
    .update({
      total_requests: (keyRecord.total_requests || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", keyRecord.id)

  return keyRecord
}

const ALLOWED_EQUIPMENT_TYPES = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]

// ── GET /api/loads ───────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authError = checkInternalSecret(request)
  if (authError) return authError

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
  } catch (err: any) {
  console.error("API POST /loads error:", JSON.stringify(err, null, 2))
  console.error("API POST /loads error message:", err?.message)
  console.error("API POST /loads error details:", err?.details)
  console.error("API POST /loads error hint:", err?.hint)
  return NextResponse.json({ 
    error: "Failed to create load",
    detail: err?.message || "unknown"
  }, { status: 500 })
}
}

// ── POST /api/loads — internal dashboard OR external API key ─────────────────
export async function POST(request: NextRequest) {

  // ── External API key path ──────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer bxl_live_")) {
    const keyRecord = await authenticateApiKey(request)
    if (!keyRecord) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
    if (keyRecord === "rate_limited") return NextResponse.json({ error: "Rate limit exceeded. Max requests/hour limit reached." }, { status: 429 })
    if (!keyRecord.can_post) return NextResponse.json({ error: "This key does not have post permission" }, { status: 403 })

    try {
      const body = await request.json()
      const {
        pickup_city, pickup_state, dropoff_city, dropoff_state,
        pickup_date, dropoff_date, equipment_type, load_type,
        total_miles, weight, pay_rate, details, status,
        broker_id, broker_name, broker_mc, upload_source,
      } = body

      // Required fields
      if (!pickup_city || !pickup_state || !dropoff_city || !dropoff_state || !equipment_type || !pay_rate) {
        return NextResponse.json({
          error: "Missing required fields: pickup_city, pickup_state, dropoff_city, dropoff_state, equipment_type, pay_rate"
        }, { status: 400 })
      }

      // Notes required
      if (!notes || notes.trim().length < 10) {
        return NextResponse.json({
          error: "Missing required field: notes. Please provide load details (minimum 10 characters)."
        }, { status: 400 })
      }

      // Pay rate minimum
      if (Number(pay_rate) < 50) {
        return NextResponse.json({
          error: "pay_rate must be at least $50."
        }, { status: 400 })
      }

      // Equipment type whitelist
      if (!ALLOWED_EQUIPMENT_TYPES.includes(equipment_type)) {
        return NextResponse.json({
          error: "Invalid equipment type. Boxaloo only accepts: Box Truck, Cargo Van, Sprinter Van, Hotshot.",
          received: equipment_type,
          allowed: ALLOWED_EQUIPMENT_TYPES,
        }, { status: 400 })
      }

      // Look up broker user by MC number
      const { data: brokerUser } = await supabase
        .from("users")
        .select("id")
        .eq("broker_mc", keyRecord.mc_number)
        .maybeSingle()

      const load = await createLoad({
        pickup_city,
        pickup_state,
        dropoff_city,
        dropoff_state,
        pickup_date: pickup_date || null,
        dropoff_date: dropoff_date || null,
        total_miles: total_miles ? Number(total_miles) : 0,
        equipment_type: equipment_type as EquipmentType,
        load_type: null,
        weight: weight ? Number(weight) : 0,
        details: notes || "",
        pay_rate: Number(pay_rate),
        broker_mc: keyRecord.mc_number,
        broker_id: brokerUser?.id || null,
        broker_name: keyRecord.company_name,
        status: "Available" as LoadStatus,
      })

      // Mark as API posted
      await supabase
        .from("loads")
        .update({ posted_via_api: true, upload_source: "api" })
        .eq("id", load.id)

      return NextResponse.json({ success: true, load_id: load.id, load }, { status: 201 })
    } catch (err) {
      console.error("API POST /loads error:", err)
      return NextResponse.json({ error: "Failed to create load" }, { status: 500 })
    }
  }

  // ── Internal dashboard path ────────────────────────────────────────────────
  const authError = checkInternalSecret(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      pickup_city, pickup_state, dropoff_city, dropoff_state,
      pickup_date, dropoff_date, equipment_type, load_type,
      total_miles, weight, pay_rate, details,
      broker_id, broker_name, broker_mc, status,
      upload_source,
    } = body

    // Required fields
    if (!pickup_city || !pickup_state || !dropoff_city || !dropoff_state || !equipment_type || !pay_rate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Equipment type whitelist
    if (!ALLOWED_EQUIPMENT_TYPES.includes(equipment_type)) {
      return NextResponse.json({
        error: "Invalid equipment type. Boxaloo only accepts: Box Truck, Cargo Van, Sprinter Van, Hotshot.",
        received: equipment_type,
        allowed: ALLOWED_EQUIPMENT_TYPES,
      }, { status: 400 })
    }

    const load = await createLoad({
      pickup_city,
      pickup_state,
      dropoff_city,
      dropoff_state,
      pickup_date: pickup_date || null,
      dropoff_date: dropoff_date || null,
      equipment_type: equipment_type as EquipmentType,
      load_type: load_type || null,
      total_miles: total_miles ? Number(total_miles) : 0,
      weight: weight ? Number(weight) : 0,
      pay_rate: Number(pay_rate),
      details: details || "",
      broker_id: broker_id || null,
      broker_name: broker_name || "",
      broker_mc: broker_mc || "",
      status: (status || "Available") as LoadStatus,
    })

    // Mark upload source
    await supabase
      .from("loads")
      .update({
        posted_via_api: false,
        upload_source: upload_source || "manual",
      })
      .eq("id", load.id)

    return NextResponse.json(load, { status: 201 })
  } catch (err) {
    console.error("POST /api/loads error:", err)
    return NextResponse.json({ error: "Failed to create load" }, { status: 500 })
  }
}

// ── PATCH /api/loads ─────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  // External API key PATCH
  if (authHeader?.startsWith("Bearer bxl_live_")) {
    const keyRecord = await authenticateApiKey(request)
    if (!keyRecord) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
    if (keyRecord === "rate_limited") return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 })
    if (!keyRecord.can_update) return NextResponse.json({ error: "This key does not have update permission" }, { status: 403 })

    try {
      const body = await request.json()
      const { load_id, ...updates } = body

      if (!load_id) return NextResponse.json({ error: "load_id is required" }, { status: 400 })

      // Verify ownership by MC number
      const { data: existingLoad } = await supabase
        .from("loads")
        .select("broker_mc")
        .eq("id", load_id)
        .maybeSingle()

      if (!existingLoad) return NextResponse.json({ error: "Load not found" }, { status: 404 })
      if (existingLoad.broker_mc !== keyRecord.mc_number) {
        return NextResponse.json({ error: "You can only update your own loads" }, { status: 403 })
      }

      // Equipment type validation on update
      if (updates.equipment_type && !ALLOWED_EQUIPMENT_TYPES.includes(updates.equipment_type as string)) {
        return NextResponse.json({
          error: "Invalid equipment type. Boxaloo only accepts: Box Truck, Cargo Van, Sprinter Van, Hotshot.",
        }, { status: 400 })
      }

      // Safe fields only
      const safeUpdates: Record<string, any> = {}
      const allowedFields = [
        "pickup_city", "pickup_state", "dropoff_city", "dropoff_state",
        "pickup_date", "dropoff_date", "equipment_type", "pay_rate",
        "total_miles", "weight", "details", "status",
      ]
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) safeUpdates[field] = updates[field]
      })

      const { data: updated, error } = await supabase
        .from("loads")
        .update(safeUpdates)
        .eq("id", load_id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, load: updated })
    } catch (err) {
      console.error("API PATCH /loads error:", err)
      return NextResponse.json({ error: "Failed to update load" }, { status: 500 })
    }
  }

  // Internal dashboard PATCH
  const authError = checkInternalSecret(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const { data: updated, error } = await supabase
      .from("loads")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(updated)
  } catch (err) {
    console.error("PATCH /api/loads error:", err)
    return NextResponse.json({ error: "Failed to update load" }, { status: 500 })
  }
}

// ── DELETE /api/loads ────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  // External API key DELETE
  if (authHeader?.startsWith("Bearer bxl_live_")) {
    const keyRecord = await authenticateApiKey(request)
    if (!keyRecord) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
    if (keyRecord === "rate_limited") return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 })
    if (!keyRecord.can_delete) return NextResponse.json({ error: "This key does not have delete permission" }, { status: 403 })

    try {
      const { load_id } = await request.json()
      if (!load_id) return NextResponse.json({ error: "load_id is required" }, { status: 400 })

      // Verify ownership
      const { data: existingLoad } = await supabase
        .from("loads")
        .select("broker_mc")
        .eq("id", load_id)
        .maybeSingle()

      if (!existingLoad) return NextResponse.json({ error: "Load not found" }, { status: 404 })
      if (existingLoad.broker_mc !== keyRecord.mc_number) {
        return NextResponse.json({ error: "You can only delete your own loads" }, { status: 403 })
      }

      const { error } = await supabase.from("loads").delete().eq("id", load_id)
      if (error) throw error
      return NextResponse.json({ success: true })
    } catch (err) {
      console.error("API DELETE /loads error:", err)
      return NextResponse.json({ error: "Failed to delete load" }, { status: 500 })
    }
  }

  // Internal dashboard DELETE
  const authError = checkInternalSecret(request)
  if (authError) return authError

  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const { error } = await supabase.from("loads").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/loads error:", err)
    return NextResponse.json({ error: "Failed to delete load" }, { status: 500 })
  }
}