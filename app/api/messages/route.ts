import { NextRequest, NextResponse } from "next/server"
import { getMessages, createMessage, markMessagesRead } from "@/lib/store"

import { checkInternalSecret } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const authError = checkInternalSecret(request)
  if (authError) return authError
  try {
    const { searchParams } = request.nextUrl
    const msgs = await getMessages({
      loadId: searchParams.get("loadId") || undefined,
    })
    return NextResponse.json(msgs)
  } catch (err) {
    console.error("GET /api/messages error:", err)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      loadId, load_id,
      senderId, sender_id,
      senderName, sender_name,
      senderRole, sender_role,
      content,
      message_type,
    } = body

    const resolvedLoadId = loadId || load_id
    const resolvedSenderId = senderId || sender_id || "anonymous"
    const resolvedSenderName = senderName || sender_name || "Unknown"
    const resolvedSenderRole = senderRole || sender_role || "broker"

    if (!resolvedLoadId || !content) {
      return NextResponse.json({ error: "load_id and content required" }, { status: 400 })
    }

    const msg = await createMessage({
      load_id: resolvedLoadId,
      sender_id: resolvedSenderId,
      sender_name: resolvedSenderName,
      sender_role: resolvedSenderRole,
      content,
      message_type: message_type || null,
    })

    return NextResponse.json(msg, { status: 201 })
  } catch (err) {
    console.error("POST /api/messages error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { loadId, load_id, userId, user_id } = body
    const resolvedLoadId = loadId || load_id
    const resolvedUserId = userId || user_id
    if (!resolvedLoadId || !resolvedUserId) {
      return NextResponse.json({ error: "loadId and userId required" }, { status: 400 })
    }
    await markMessagesRead(resolvedLoadId, resolvedUserId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("PATCH /api/messages error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}