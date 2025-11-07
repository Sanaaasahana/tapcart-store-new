import { type NextRequest, NextResponse } from "next/server"
import { verifyStoreCredentials } from "@/lib/db"
import { setStoreSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { storeId, password } = await request.json()

    if (!storeId || !password) {
      return NextResponse.json({ error: "Store ID and password are required" }, { status: 400 })
    }

    const isValid = await verifyStoreCredentials(storeId, password)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials or account not approved" }, { status: 401 })
    }

    const sessionCookie = setStoreSession(storeId)
    const response = NextResponse.json({ success: true })

    response.cookies.set(sessionCookie)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
