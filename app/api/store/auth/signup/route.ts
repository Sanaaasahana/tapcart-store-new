import { type NextRequest, NextResponse } from "next/server"
import { createPendingStore, listStores } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { storeId, password, email } = await request.json()

    if (!storeId || !password || !email) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Server-side password validation
    if (password.length < 6 || !/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters and include one uppercase letter" },
        { status: 400 }
      )
    }

    // Demo: store a simple hash placeholder. Replace with bcrypt in real app
    const passwordHash = `sha:${Buffer.from(password).toString("base64")}`

    await createPendingStore(storeId, email, passwordHash)

    return NextResponse.json({
      success: true,
      message: "Registration submitted for approval",
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  const stores = await listStores()
  return NextResponse.json({ stores })
}
