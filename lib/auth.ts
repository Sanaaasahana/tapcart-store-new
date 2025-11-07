// Authentication utilities and session management
import { cookies } from "next/headers"

export interface StoreSession {
  storeId: string
  isAuthenticated: boolean
}

export interface AdminSession {
  email: string
  isAuthenticated: boolean
}

export async function getStoreSession(): Promise<StoreSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("store-session")

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    return session
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("admin-session")

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    return session
  } catch {
    return null
  }
}

export function setStoreSession(storeId: string) {
  const session: StoreSession = {
    storeId,
    isAuthenticated: true,
  }

  return {
    name: "store-session",
    value: JSON.stringify(session),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

export function setAdminSession(email: string) {
  const session: AdminSession = {
    email,
    isAuthenticated: true,
  }

  return {
    name: "admin-session",
    value: JSON.stringify(session),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

export function clearSession(type: "store" | "admin") {
  const cookieName = type === "store" ? "store-session" : "admin-session"

  return {
    name: cookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
  }
}
