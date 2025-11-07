import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return neon(url)
}

// Public API to handle purchases
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, products, customerPhone, customerName, transactionId, paymentMethod } = body

    if (!storeId || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Invalid request: storeId and products array required" }, { status: 400 })
    }

    const sql = getSql()

    // Start transaction-like operations
    // First, verify all products are available and lock them
    const productChecks = []
    for (const item of products) {
      const { productId, id, quantity = 1 } = item
      
      let product
      if (id) {
        const rows = await sql`
          select id, store_id, name, price, stock, custom_id
          from products 
          where id = ${id}::int and store_id = ${storeId}
          limit 1
        `
        product = rows[0]
      } else if (productId) {
        const rows = await sql`
          select id, store_id, name, price, stock, custom_id
          from products 
          where custom_id = ${productId} and store_id = ${storeId}
          limit 1
        `
        product = rows[0]
      }

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId || id}` }, { status: 404 })
      }

      const currentStock = parseInt(product.stock) || 0
      if (currentStock < quantity) {
        return NextResponse.json({ 
          error: `Product ${product.name} is out of stock. Available: ${currentStock}, Requested: ${quantity}` 
        }, { status: 400 })
      }

      productChecks.push({ ...product, requestedQuantity: quantity })
    }

    // All products are available, now process the purchase
    // Create or get customer
    let customerId
    if (customerPhone) {
      // Check if customer exists
      const existingCustomer = await sql`
        select id from customers 
        where store_id = ${storeId} and phone = ${customerPhone}
        limit 1
      `
      
      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id
        // Update customer name if provided
        if (customerName) {
          await sql`
            update customers set name = ${customerName}
            where id = ${customerId}
          `
        }
      } else {
        // Create new customer
        const newCustomer = await sql`
          insert into customers (store_id, name, phone)
          values (${storeId}, ${customerName || 'Customer'}, ${customerPhone})
          returning id
        `
        customerId = newCustomer[0].id
      }
    } else {
      // Create anonymous customer
      const newCustomer = await sql`
        insert into customers (store_id, name, phone)
        values (${storeId}, ${customerName || 'Customer'}, 'anonymous')
        returning id
      `
      customerId = newCustomer[0].id
    }

    // Process each product purchase
    const purchaseResults = []
    let totalAmount = 0

    for (const productData of productChecks) {
      const { id, price, requestedQuantity, name } = productData
      const productTotal = parseFloat(price) * requestedQuantity
      totalAmount += productTotal

      // Update product stock (reduce by quantity)
      await sql`
        update products 
        set stock = stock - ${requestedQuantity}
        where id = ${id} and store_id = ${storeId}
      `

      // Record purchase
      const purchase = await sql`
        insert into purchases (store_id, customer_id, product_id, quantity, total_amount)
        values (${storeId}, ${customerId}, ${id}, ${requestedQuantity}, ${productTotal})
        returning id
      `

      purchaseResults.push({
        productId: id,
        productName: name,
        quantity: requestedQuantity,
        amount: productTotal,
        purchaseId: purchase[0].id
      })
    }

    return NextResponse.json({
      success: true,
      purchaseId: purchaseResults[0]?.purchaseId,
      totalAmount,
      products: purchaseResults,
      customerId,
      transactionId,
      paymentMethod
    })
  } catch (err) {
    console.error("Purchase POST error", err)
    return NextResponse.json({ error: "Internal server error", details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

