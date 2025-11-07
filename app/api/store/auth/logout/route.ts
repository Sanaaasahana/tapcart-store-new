import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"

export async function POST() {
  const sessionCookie = clearSession("store")
  const response = NextResponse.json({ success: true })

  response.cookies.set(sessionCookie)

  return response
}
