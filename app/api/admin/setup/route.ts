import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return neon(url)
}

// Simple password hash function (for demo purposes)
function simpleHash(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

export async function POST() {
  try {
    const sql = getSql()
    
    // Ensure admin_users table exists
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Use simple hash for demo (in production, use proper hashing)
    const hashedPassword = simpleHash('Sm2226#')
    
    // Insert or update admin user
    await sql`
      INSERT INTO admin_users (email, password_hash) 
      VALUES ('sahanapradeep2207@gmail.com', ${hashedPassword})
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = EXCLUDED.password_hash
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin user setup completed successfully!',
      credentials: {
        email: 'sahanapradeep2207@gmail.com',
        password: 'Sm2226#'
      }
    })
    
  } catch (error) {
    console.error('Error setting up admin user:', error)
    return NextResponse.json({ 
      error: 'Failed to setup admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
