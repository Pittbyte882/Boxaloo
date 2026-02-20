import { NextRequest, NextResponse } from "next/server"
import { createDriver } from "@/lib/store"
import type { EquipmentType } from "@/lib/mock-data"

// Public endpoint for driver self-signup via onboarding page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, company, mc, dot, equipmentType, phone, email, documents } = body

    if (!name || !company || !mc || !dot || !equipmentType || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const driver = createDriver({
      name,
      company,
      mc,
      dot,
      equipmentType: equipmentType as EquipmentType,
      phone,
      email: email || "",
      documents: {
        mcLetter: documents?.mcLetter ? "uploaded" : "pending",
        insurance: documents?.insurance ? "uploaded" : "pending",
        w9: documents?.w9 ? "uploaded" : "pending",
        noticeOfAssignment: documents?.noa ? "uploaded" : "optional",
      },
    })

    return NextResponse.json(driver, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
