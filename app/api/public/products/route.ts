import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return neon(url)
}

// Public API to get product by storeId and productId (custom_id)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")
    const productId = searchParams.get("productId") // This is the custom_id
    const id = searchParams.get("id") // This is the database id

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 })
    }

    const sql = getSql()

    let product
    if (id) {
      // Fetch by database id
      const rows = await sql`
        select id, store_id, name, coalesce(category,'General') as category, 
               custom_id, (price::float8) as price, 
               coalesce(stock,1)::int as stock,
               (case when coalesce(stock,1) > 0 then 'available' else 'sold' end) as status
        from products 
        where id = ${id}::int and store_id = ${storeId}
        limit 1
      `
      product = rows[0]
    } else if (productId) {
      // Fetch by custom_id
      const rows = await sql`
        select id, store_id, name, coalesce(category,'General') as category, 
               custom_id, (price::float8) as price, 
               coalesce(stock,1)::int as stock,
               (case when coalesce(stock,1) > 0 then 'available' else 'sold' end) as status
        from products 
        where custom_id = ${productId} and store_id = ${storeId}
        limit 1
      `
      product = rows[0]
    } else {
      // Fetch all products for the store
      const rows = await sql`
        select id, store_id, name, coalesce(category,'General') as category, 
               custom_id, (price::float8) as price, 
               coalesce(stock,1)::int as stock,
               (case when coalesce(stock,1) > 0 then 'available' else 'sold' end) as status
        from products 
        where store_id = ${storeId}
        order by id desc
      `
      return NextResponse.json({ products: rows })
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (err) {
    console.error("Public products GET error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

