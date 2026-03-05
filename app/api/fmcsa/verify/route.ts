import { NextRequest, NextResponse } from "next/server"
import { checkInternalSecret } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const authError = checkInternalSecret(request)
  if (authError) return authError

  const { searchParams } = request.nextUrl
  const mc = searchParams.get("mc")

  if (!mc || !/^\d+$/.test(mc)) {
    return NextResponse.json({ error: "Invalid MC number" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number/${mc}?webKey=${process.env.FMCSA_API_KEY}`,
      { headers: { "Accept": "application/json" } }
    )

    const data = await res.json()

    // FMCSA returns content as an array
    const carrier = Array.isArray(data?.content)
      ? data.content[0]?.carrier
      : data?.content?.carrier

    if (!carrier) {
      return NextResponse.json({
        valid: false,
        authorized: false,
        error: "MC# not found in FMCSA database",
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
  } catch (err) {
    return NextResponse.json({
      valid: false,
      authorized: false,
      error: "FMCSA verification service unavailable. Please try again.",
    })
  }
}