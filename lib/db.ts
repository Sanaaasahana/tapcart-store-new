import { neon } from "@neondatabase/serverless"

export interface Store {
  id: number
  store_id: string
  email: string
  status: "pending" | "approved" | "denied"
  created_at: string
  approved_at?: string
}

export interface Product {
  id: number
  store_id: string
  name: string
  stock: number
  price: number
}

export interface Customer {
  id: number
  store_id: string
  name: string
  phone: string
}

export interface Purchase {
  id: number
  store_id: string
  customer_id: number
  customer_name: string
  product_name: string
  quantity: number
  total_amount: number
  purchase_date: string
}

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return neon(url)
}

// Stores
export async function createPendingStore(storeId: string, email: string, passwordHash: string): Promise<void> {
  const sql = getSql()
  await sql`insert into stores (store_id, email, password_hash, status)
            values (${storeId}, ${email}, ${passwordHash}, 'pending')
            on conflict (store_id) do nothing`
}

export async function listStores(): Promise<Store[]> {
  const sql = getSql()
  const rows = await sql`select id, store_id, email, status, created_at, approved_at from stores order by created_at desc`
  return rows as unknown as Store[]
}

export async function getAllStores(): Promise<Store[]> {
  return listStores()
}

export async function approveOrDenyStore(storeId: string, action: "approve" | "deny"): Promise<void> {
  const sql = getSql()
  if (action === "approve") {
    await sql`update stores set status = 'approved', approved_at = now() where store_id = ${storeId}`
  } else {
    await sql`update stores set status = 'denied' where store_id = ${storeId}`
  }
}

// Authentication helpers (demo)
export async function getStoreByStoreId(storeId: string): Promise<Store | null> {
  const sql = getSql()
  const rows = await sql`select id, store_id, email, status, created_at, approved_at from stores where store_id = ${storeId} limit 1`
  return (rows as any[])[0] || null
}

export async function verifyStoreCredentials(storeId: string, password: string): Promise<boolean> {
  const store = await getStoreByStoreId(storeId)
  return !!store && store.status === "approved"
}

// Products
export async function getProductsByStoreId(storeId: string): Promise<Product[]> {
  const sql = getSql()
  const rows = await sql`
    select id,
           store_id,
           name,
           (stock::int)   as stock,
           (price::float) as price
    from products
    where store_id = ${storeId}
    order by id asc
  `
  return rows as unknown as Product[]
}

// Customers
export async function getCustomersByStoreId(storeId: string): Promise<Customer[]> {
  const sql = getSql()
  const rows = await sql`select id, store_id, name, phone from customers where store_id = ${storeId} order by id asc`
  return rows as unknown as Customer[]
}

// Purchases
export async function getPurchasesByStoreId(storeId: string): Promise<Purchase[]> {
  const sql = getSql()
  const rows = await sql`
    select p.id,
           p.store_id,
           p.customer_id,
           c.name as customer_name,
           pr.name as product_name,
           p.quantity,
           p.total_amount,
           p.purchase_date
    from purchases p
    left join customers c on c.id = p.customer_id
    left join products pr on pr.id = p.product_id
    where p.store_id = ${storeId}
    order by p.purchase_date desc, p.id desc`
  return rows as unknown as Purchase[]
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

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const sql = getSql()
  
  try {
    // Get the admin user's password hash
    const result = await sql`
      select password_hash from admin_users where email = ${email} limit 1
    `
    
    if (!result || result.length === 0) {
      return false
    }
    
    const user = result[0] as { password_hash: string }
    
    // Use simple hash verification (for demo - in production use proper hashing)
    const inputHash = simpleHash(password)
    return inputHash === user.password_hash
    
  } catch (error) {
    console.error('Error verifying admin credentials:', error)
    return false
  }
}
