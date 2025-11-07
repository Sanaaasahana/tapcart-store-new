"use client"

import { useEffect, useMemo, useState } from "react"
import { StoreSidebar } from "@/components/store-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package2, Search, Filter, IndianRupee, TrendingUp, BarChart3 } from "lucide-react"

interface ProductItem {
  id: number
  custom_id?: string
  name: string
  category: string
  price: number
  stock: number
}

export default function AllProductsPage() {
  const [items, setItems] = useState<ProductItem[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("all")

  const load = async () => {
    const res = await fetch("/api/store/products")
    const data = await res.json()
    setItems(data.items || [])
  }

  useEffect(() => {
    load()
  }, [])

  const categories = useMemo(() => {
    const s = new Set(items.map((i) => i.category || "General"))
    return ["all", ...Array.from(s)]
  }, [items])

  const filtered = useMemo(() => {
    return items
      .filter((i) => (category === "all" ? true : i.category === category))
      .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || String(i.id).includes(search) || (i.custom_id && i.custom_id.toLowerCase().includes(search.toLowerCase())))
  }, [items, search, category])

  const categoryTotals = useMemo(() => {
    const map = new Map<string, { items: number; stock: number }>()
    for (const i of filtered) {
      const key = i.category || "General"
      const cur = map.get(key) || { items: 0, stock: 0 }
      cur.items += 1
      cur.stock += Number(i.stock || 0)
      map.set(key, cur)
    }
    return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }))
  }, [filtered])

  return (
    <div className="min-h-screen bg-slate-50">
      <StoreSidebar />
      <div className="lg:ml-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">All Products</h1>
                <p className="text-slate-600">Search, filter by category, and view totals per category</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {filtered.length} products
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Products</CardTitle>
                <Package2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{items.length}</div>
                <p className="text-xs text-slate-500 mt-1">All products in inventory</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Categories</CardTitle>
                <BarChart3 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{categories.length - 1}</div>
                <p className="text-xs text-slate-500 mt-1">Product categories</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Value</CardTitle>
                <IndianRupee className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  ₹{items.reduce((sum, item) => sum + (item.price * item.stock), 0).toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Inventory worth</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input 
                    placeholder="Search by item name or ID" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="pl-10" 
                  />
                </div>
                <div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c === "all" ? "All Categories" : c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Showing {filtered.length} of {items.length} items
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {category !== "all" && (
            <Card className="border-0 shadow-sm mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">{category} Category</CardTitle>
                <CardDescription>Items in this category with quantities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 mb-4">
                  Total items: {categoryTotals.find(c => c.category === category)?.items || 0} • 
                  Total stock: {categoryTotals.find(c => c.category === category)?.stock || 0}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Product Catalog</CardTitle>
              <CardDescription>Complete list of all products with details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filtered.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Package2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{p.name}</h3>
                          <p className="text-sm text-slate-500">#{p.custom_id || 'No ID'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <Badge variant="secondary" className="text-xs mb-1">
                          {p.category}
                        </Badge>
                        <div className="text-xs text-slate-500">Category</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-900 font-medium">₹{p.price.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-900 font-medium">{p.stock}</div>
                        <div className="text-xs text-slate-500">Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-900 font-medium">₹{(p.price * p.stock).toFixed(2)}</div>
                        <div className="text-xs text-slate-500">Value</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-10">
                    <Package2 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
                    <p className="text-slate-500">
                      {items.length === 0 
                        ? "No products available in your inventory."
                        : "Try adjusting your search or filter criteria."
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


