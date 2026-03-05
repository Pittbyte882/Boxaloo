import { NextRequest, NextResponse } from "next/server"
import { checkInternalSecret } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  //const authError = checkInternalSecret(request)
  //if (authError) return authError

  const { searchParams } = request.nextUrl
  const mc = searchParams.get("mc")

  if (!mc || !/^\d+$/.test(mc)) {
    return NextResponse.json({ error: "Invalid MC number" }, { status: 400 })
  }

  try {
    const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number/${mc}?webKey=${process.env.FMCSA_API_KEY}`
    console.log("FMCSA URL:", url)

    const res = await fetch(url, { headers: { "Accept": "application/json" } })
    console.log("FMCSA HTTP status:", res.status)

    const raw = await res.text()
    console.log("FMCSA raw response:", raw)

    let data: any
    try {
      data = JSON.parse(raw)
    } catch {
      return NextResponse.json({
        valid: false,
        authorized: false,
        error: "FMCSA returned unexpected response",
        debug_raw: raw.slice(0, 500),
      })
    }

    const carrier = data?.content?.carrier

    if (!carrier) {
      return NextResponse.json({
        valid: false,
        authorized: false,
        error: "MC# not found in FMCSA database",
        debug_data: data,
      })
    }

    const allowedToOperate = carrier.allowedToOperate === "Y"

    return NextResponse.json({
      valid: true,
      authorized: allowedToOperate,
      legalName: carrier.legalName || carrier.dbaName || "",
      dotNumber: String(carrier.dotNumber || ""),
      status: carrier.statusCode,
      entityType: carrier.carrierOperation?.carrierOperationDesc || "",
      error: allowedToOperate ? null : "MC# is not active — account cannot be created at this time",
    })
  } catch (err: any) {
    console.error("FMCSA fetch error:", err)
    return NextResponse.json({
      valid: false,
      authorized: false,
      error: "FMCSA verification service unavailable. Please try again.",
      debug_error: err?.message,
    })
  }
}