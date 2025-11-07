"use client"

import { useEffect, useState } from "react"
import { StoreSidebar } from "@/components/store-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, Link, Search, Filter, CheckSquare, Square } from "lucide-react"
import { getStoreSession } from "@/lib/auth"

interface ProductItem {
  id: number
  custom_id?: string
  name: string
  category: string
  price: number
  stock: number
}

interface CategoryCount { category: string; count: number }

export const dynamic = "force-dynamic"

export default function StoreExportPage() {
  const [items, setItems] = useState<ProductItem[]>([])
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([])
  const [loading, setLoading] = useState(false)
  const [storeName, setStoreName] = useState("")

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/store/products")
      if (!res.ok) {
        console.error("Failed to load products:", res.status)
        return
      }
      const data = await res.json()
      setItems(data.items || [])
      setCategoryCounts(data.categoryCounts || [])
      
      // Get store name from session
      try {
        const sessionRes = await fetch("/api/store/auth/session")
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          setStoreName(sessionData.storeId || "")
        }
      } catch (error) {
        console.error("Failed to load store session:", error)
      }
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Filter and search logic
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.custom_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  // Handle individual item selection
  const handleItemSelect = (itemId: number, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
    
    // Update select all state
    setSelectAll(newSelected.size === filteredItems.length && filteredItems.length > 0)
  }

  // Generate export links
  const generateLinks = () => {
    const selectedProducts = items.filter(item => selectedItems.has(item.id))
    const links = selectedProducts.map(product => {
      const productId = product.custom_id || product.id.toString()
      return `${storeName}/${productId}/cart.com`
    })
    
    return links.join('\n')
  }

  // Export to CSV
  const exportToCSV = (exportAll = false) => {
    const productsToExport = exportAll ? items : items.filter(item => selectedItems.has(item.id))
    
    if (productsToExport.length === 0) {
      alert('No products selected for export')
      return
    }

    const csvContent = [
      ['Product Name', 'Product ID', 'Category', 'Price', 'Stock', 'Link'],
      ...productsToExport.map(product => [
        product.name,
        product.custom_id || product.id.toString(),
        product.category,
        product.price.toString(),
        product.stock.toString(),
        `${storeName}/${product.custom_id || product.id}/cart.com`
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `product-links-${exportAll ? 'all' : 'selected'}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export only links to CSV
  const exportLinksOnlyCSV = (exportAll = false) => {
    const productsToExport = exportAll ? items : items.filter(item => selectedItems.has(item.id))
    
    if (productsToExport.length === 0) {
      alert('No products selected for export')
      return
    }

    const links = productsToExport.map(product => 
      `${storeName}/${product.custom_id || product.id}/cart.com`
    )

    // Create CSV content with proper CSV formatting
    const csvContent = links.map(link => `"${link}"`).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `product-links-only-${exportAll ? 'all' : 'selected'}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Copy links to clipboard
  const copyLinks = async () => {
    const links = generateLinks()
    try {
      await navigator.clipboard.writeText(links)
      alert('Links copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy links:', error)
      alert('Failed to copy links to clipboard')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StoreSidebar />

      <div className="lg:ml-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Export Product Links</h1>
            <p className="text-slate-600">Select products and export their purchase links</p>
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
                    placeholder="Search products, IDs, or categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoryCounts.map((category) => (
                        <SelectItem key={category.category} value={category.category}>
                          {category.category} ({category.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedItems.size} of {filteredItems.length} selected
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Export Actions</CardTitle>
              <CardDescription>Export product links and data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => exportToCSV(true)}
                    disabled={!storeName || items.length === 0}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download All Products CSV ({items.length} items)
                  </Button>
                  <Button
                    onClick={() => exportToCSV(false)}
                    disabled={selectedItems.size === 0 || !storeName}
                    variant="outline"
                    className="gap-2 bg-white text-black border-gray-300 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                    Download Selected CSV ({selectedItems.size} items)
                  </Button>
                  <Button
                    onClick={() => exportLinksOnlyCSV(false)}
                    disabled={selectedItems.size === 0 || !storeName}
                    variant="outline"
                    className="gap-2 bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4" />
                    Download Selected Links Only ({selectedItems.size} items)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyLinks}
                    disabled={selectedItems.size === 0 || !storeName}
                    className="gap-2 bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                  >
                    <Link className="h-4 w-4" />
                    Copy Links ({selectedItems.size} items)
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedItems(new Set())
                      setSelectAll(false)
                    }}
                    disabled={selectedItems.size === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
                {storeName && (
                  <div className="text-sm text-slate-500">
                    Links will be formatted as: <code className="bg-slate-100 px-2 py-1 rounded">{storeName}/product-id/cart.com</code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Select Products</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="selectAll" className="text-sm font-medium">
                    Select All ({filteredItems.length})
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">{item.name}</h3>
                          <p className="text-sm text-slate-500">#{item.custom_id || 'No ID'}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-slate-900">₹{item.price.toFixed(2)}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {storeName}/{item.custom_id || item.id}/cart.com
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredItems.length === 0 && (
                  <div className="text-center py-10">
                    <Link className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
                    <p className="text-slate-500">
                      {items.length === 0 
                        ? "No products available to export."
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
