'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, Loader2, Zap } from 'lucide-react'
import { updateProductVariant, deleteProductVariant, bulkCreateProductVariants, bulkUpdateVariantsStock } from '@/actions/products'

type Variant = {
  id: string
  product_id: string
  variant_name: string
  price: number
  original_price: number | null
  stock_quantity: number
  is_active: boolean
}

type BulkVariantForm = {
  id: string
  variant_name: string
  price: string
  original_price: string
  stock_quantity: string
  is_active: boolean
}

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function variantBelongsToColor(variantName: string, colorName: string): boolean {
  const normalizedVariantName = normalizeName(variantName)
  const normalizedColorName = normalizeName(colorName)

  return (
    normalizedVariantName === normalizedColorName ||
    normalizedVariantName.startsWith(`${normalizedColorName} -`) ||
    normalizedVariantName.startsWith(`${normalizedColorName} /`) ||
    normalizedVariantName.startsWith(`${normalizedColorName} `)
  )
}

export function extractSizeOnly(value: string): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ')
    return parts[parts.length - 1].trim()
  }
  if (trimmed.includes(' / ')) {
    const parts = trimmed.split(' / ')
    return parts[parts.length - 1].trim()
  }
  if (trimmed.includes('(')) {
    return trimmed.replace(/\(.*?\)/g, '').trim()
  }
  return trimmed
}

export function extractColorFromVariant(value: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ')
    return parts.slice(0, -1).join(' - ').trim()
  }
  if (trimmed.includes(' / ')) {
    const parts = trimmed.split(' / ')
    return parts.slice(0, -1).join(' / ').trim()
  }
  const match = trimmed.match(/\((.*?)\)/)
  if (match) return match[1].trim()
  return null
}

export function ProductVariantsEditor({
  productId,
  variants,
  colorName,
}: {
  productId: string
  variants: Variant[]
  colorName?: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('All')
  const [variantsList, setVariantsList] = useState<Variant[]>(variants)
  const [shortcutStock, setShortcutStock] = useState('10')
  const [isUpdatingStock, setIsUpdatingStock] = useState(false)
  const [stockSuccessMsg, setStockSuccessMsg] = useState('')

  // Sync state if server prop updates
  useEffect(() => {
    setVariantsList(variants)
  }, [variants])

  // Real-time listener for color stock changes dispatched from ProductForm
  useEffect(() => {
    const handleColorStockUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ colorName: string; stock: number }>).detail
      if (!detail || typeof detail.stock !== 'number') return
      const { colorName: targetColor, stock } = detail

      setVariantsList((prev) =>
        prev.map((v) => {
          const belongs = variantBelongsToColor(v.variant_name, targetColor)
          const isGeneric = !extractColorFromVariant(v.variant_name)
          if (belongs || (isGeneric && (!targetColor || targetColor.toLowerCase() === 'all'))) {
            return { ...v, stock_quantity: stock }
          }
          return v
        })
      )
    }

    window.addEventListener('teenzos-color-stock-updated', handleColorStockUpdated)
    return () => window.removeEventListener('teenzos-color-stock-updated', handleColorStockUpdated)
  }, [])

  // Derive colors
  const productColors = (() => {
    if (!colorName) return []
    try {
      if (colorName.startsWith('[')) {
        const parsed = JSON.parse(colorName) as { name: string; hex: string }[]
        return parsed.map(c => c.name.trim()).filter(Boolean)
      }
    } catch (e) {}
    return colorName.split(',').map(c => c.trim()).filter(Boolean)
  })()

  // Automatically update active tab based on view state
  useEffect(() => {
    if (productColors.length > 0) {
      if (isAdding) {
        setActiveTab('General')
      } else {
        setActiveTab('All')
      }
    } else {
      setActiveTab('All')
    }
  }, [isAdding, colorName])

  // Filter variants for display based on active color tab
  const displayedVariants = variantsList.filter(v => {
    if (activeTab === 'All') return true
    
    return variantBelongsToColor(v.variant_name, activeTab)
  })

  // Single Edit Form State
  const [formData, setFormData] = useState({
    variant_name: '',
    price: '',
    original_price: '',
    stock_quantity: '0',
    is_active: true,
  })

  // Bulk Add Form State
  const [bulkData, setBulkData] = useState<BulkVariantForm[]>([])

  const handleApplyShortcutStock = async (stockStr: string) => {
    const val = Math.max(0, parseInt(stockStr || '0', 10) || 0)
    setShortcutStock(val.toString())

    // 1. If currently in bulk add mode:
    if (isAdding) {
      setBulkData((prev) =>
        prev.map((row) => ({
          ...row,
          stock_quantity: val.toString(),
        }))
      )
      setStockSuccessMsg(`Applied ${val} stock to all size options in the form!`)
      setTimeout(() => setStockSuccessMsg(''), 3000)
      return
    }

    // 2. If no variants exist yet and not in adding mode:
    if (variantsList.length === 0 && !isAdding) {
      const defaultPrefix = activeTab !== 'All' && activeTab !== 'General' ? `${activeTab} - ` : ''
      setBulkData(STANDARD_SIZES.map(size => ({
        id: crypto.randomUUID(),
        variant_name: defaultPrefix ? `${defaultPrefix}${size}` : size,
        price: '',
        original_price: '',
        stock_quantity: val.toString(),
        is_active: true
      })))
      setIsAdding(true)
      setEditingId(null)
      setStockSuccessMsg(`Started with standard sizes set to ${val} stock!`)
      setTimeout(() => setStockSuccessMsg(''), 3500)
      return
    }

    // 3. If variants exist in database:
    if (variantsList.length > 0) {
      setIsUpdatingStock(true)
      setVariantsList((prev) =>
        prev.map((v) => {
          if (activeTab === 'All' || variantBelongsToColor(v.variant_name, activeTab)) {
            return { ...v, stock_quantity: val }
          }
          return v
        })
      )

      try {
        const result = await bulkUpdateVariantsStock(
          productId,
          val,
          activeTab === 'All' ? null : activeTab
        )
        if (result.error) {
          alert(`Error updating stock: ${result.error}`)
        } else {
          setStockSuccessMsg(
            `All ${activeTab === 'All' ? 'sizes' : `${activeTab} sizes`} updated to ${val} stock in database!`
          )
          setTimeout(() => setStockSuccessMsg(''), 3000)
        }
      } catch (err: any) {
        alert(`Failed to update stock: ${err.message}`)
      } finally {
        setIsUpdatingStock(false)
      }
    }
  }

  const initializeBulkForm = () => {
    // Start bulk form with standard sizes using shortcut stock (default 10)
    const stockToUse = shortcutStock || '10'
    setBulkData(STANDARD_SIZES.map(size => ({
      id: crypto.randomUUID(),
      variant_name: size,
      price: '',
      original_price: '',
      stock_quantity: stockToUse,
      is_active: true
    })))
    setIsAdding(true)
    setEditingId(null)
    setActiveTab(productColors.length > 0 ? 'General' : 'All')
  }

  const handleApplyToAllColors = () => {
    // Get general template rows (rows that do not contain any of the color names)
    const generalRows = bulkData.filter(row => {
      return !productColors.some(color => variantBelongsToColor(row.variant_name, color))
    })

    // Filter out template rows that are empty (no price filled)
    const activeTemplates = generalRows.filter(r => r.price.trim() !== '')

    if (activeTemplates.length === 0) {
      alert("Please fill in at least one size with a price first.")
      return
    }

    // Generate color-specific combinations
    const newCombinations: BulkVariantForm[] = []
    productColors.forEach(color => {
      activeTemplates.forEach(tpl => {
        newCombinations.push({
          id: crypto.randomUUID(),
          variant_name: `${color} - ${tpl.variant_name}`,
          price: tpl.price,
          original_price: tpl.original_price,
          stock_quantity: tpl.stock_quantity,
          is_active: tpl.is_active
        })
      })
    })

    // Update bulk data, keeping the general templates plus the new generated combinations
    setBulkData(prev => {
      // Remove any existing rows that start with color names to avoid duplicates
      const filteredPrev = prev.filter(r => {
        return !productColors.some(color => variantBelongsToColor(r.variant_name, color))
      })
      return [...filteredPrev, ...newCombinations]
    })

    // Switch tab to first color to let them review
    setActiveTab(productColors[0] || 'All')
  }

  const addCustomSizeRow = () => {
    const defaultPrefix = activeTab !== 'All' && activeTab !== 'General' ? `${activeTab} - ` : ''
    setBulkData(prev => [...prev, {
      id: crypto.randomUUID(),
      variant_name: defaultPrefix,
      price: '',
      original_price: '',
      stock_quantity: shortcutStock || '10',
      is_active: true
    }])
  }

  const removeBulkRow = (id: string) => {
    setBulkData(prev => prev.filter(r => r.id !== id))
  }

  const updateBulkRow = (id: string, field: keyof BulkVariantForm, value: string | boolean) => {
    setBulkData(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const resetForm = () => {
    setFormData({
      variant_name: '',
      price: '',
      original_price: '',
      stock_quantity: '0',
      is_active: true,
    })
    setBulkData([])
    setIsAdding(false)
    setEditingId(null)
  }

  const handleEdit = (variant: Variant) => {
    setFormData({
      variant_name: extractSizeOnly(variant.variant_name),
      price: variant.price.toString(),
      original_price: variant.original_price ? variant.original_price.toString() : '',
      stock_quantity: variant.stock_quantity.toString(),
      is_active: variant.is_active,
    })
    setEditingId(variant.id)
    setIsAdding(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this size option?')) {
      startTransition(async () => {
        setVariantsList((prev) => prev.filter((v) => v.id !== id))
        const result = await deleteProductVariant(id, productId)

        if (result.error) {
          alert(result.error)
        }
      })
    }
  }

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.append('product_id', productId)

      let finalName = formData.variant_name.trim()
      if (editingId) {
        const original = variantsList.find((v) => v.id === editingId)
        const col = original ? extractColorFromVariant(original.variant_name) : null
        if (col && !finalName.toLowerCase().includes(col.toLowerCase())) {
          finalName = `${col} - ${finalName}`
        }
      } else if (activeTab !== 'All' && activeTab !== 'General') {
        finalName = `${activeTab} - ${finalName}`
      }

      fd.append('variant_name', finalName)
      fd.append('price', formData.price)
      if (formData.original_price) fd.append('original_price', formData.original_price)
      fd.append('stock_quantity', formData.stock_quantity)
      if (formData.is_active) fd.append('is_active', 'on')

      if (editingId) {
        fd.append('id', editingId)
        const result = await updateProductVariant({}, fd)

        if (result.error) {
          alert(result.error)
          return
        }

        // Optimistically update variantsList in UI
        setVariantsList((prev) =>
          prev.map((v) =>
            v.id === editingId
              ? {
                  ...v,
                  variant_name: finalName,
                  price: parseFloat(formData.price),
                  original_price: formData.original_price ? parseFloat(formData.original_price) : null,
                  stock_quantity: parseInt(formData.stock_quantity || '0', 10),
                  is_active: formData.is_active,
                }
              : v
          )
        )
      }
      resetForm()
    })
  }

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out rows that are completely empty or missing required fields
    const validRows = bulkData.filter(r => r.variant_name.trim() !== '' && r.price.trim() !== '')
    
    if (validRows.length === 0) {
      alert("Please fill in at least one size option with a name and price.")
      return
    }

    const colorSpecificRows = validRows.filter(row =>
      productColors.some(color => variantBelongsToColor(row.variant_name, color))
    )
    const rowsToSave = productColors.length > 0 && colorSpecificRows.length > 0
      ? colorSpecificRows
      : validRows

    startTransition(async () => {
      const formattedVariants = rowsToSave.map(r => ({
        variant_name: r.variant_name,
        price: parseFloat(r.price),
        original_price: r.original_price ? parseFloat(r.original_price) : null,
        stock_quantity: parseInt(r.stock_quantity || '0', 10),
        is_active: r.is_active
      }))
      
      const result = await bulkCreateProductVariants(productId, formattedVariants)

      if (result.error) {
        alert(result.error)
        return
      }

      resetForm()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-ink">Size Options</h3>
        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={initializeBulkForm}
            disabled={isPending || isUpdatingStock}
            className="admin-primary-action px-4 py-2 text-sm rounded-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Size Options
          </button>
        )}
      </div>

      {/* ─── QUICK STOCK SHORTCUT BAR (AT STARTING) ────────────────── */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#FAF9F8] via-white to-pink-50/20 border border-stone-200/90 shadow-2xs space-y-2">
        <div className="flex flex-col flex-wrap justify-between gap-4">
          <div className="flex items-center gap-2 w-full">
            <div className="w-7 h-7 rounded-lg bg-[#FF007A]/10 text-[#FF007A] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900">
                  Stock Shortcut (Bulk Set)
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                  Instant
                </span>
              </div>
            </div>
          </div>

          {/* Quick presets + input + Apply button */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-between">
            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1 shadow-2xs">
              <span className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wider">
                Stock:
              </span>
              <input
                type="number"
                min="0"
                value={shortcutStock}
                onChange={(e) => setShortcutStock(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleApplyShortcutStock(shortcutStock)
                  }
                }}
                className="w-12 text-xs font-black text-center text-stone-900 bg-transparent focus:outline-none"
                placeholder="10"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1">
              {['5', '10', '20', '50'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyShortcutStock(preset)}
                  disabled={isPending || isUpdatingStock}
                  className="text-[11px] font-bold px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                  title={`Apply ${preset} stock to all sizes`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleApplyShortcutStock(shortcutStock)}
              disabled={isPending || isUpdatingStock}
              className="px-3 py-1.5 bg-[#0B0D0E] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isUpdatingStock ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Apply to All</span>
            </button>
          </div>
        </div>

        {stockSuccessMsg && (
          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{stockSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Color Filter Tabs */}
      {productColors.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-cream-line pb-3">
          {!isAdding && (
            <button
              type="button"
              onClick={() => setActiveTab('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'All'
                  ? 'bg-panel text-ink'
                  : 'text-ink/60 hover:bg-panel2'
              }`}
            >
              All Sizes ({variantsList.length})
            </button>
          )}

          {isAdding && (
            <button
              type="button"
              onClick={() => setActiveTab('General')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'General'
                  ? 'bg-panel text-ink'
                  : 'text-ink/60 hover:bg-panel2'
              }`}
            >
              General Template
            </button>
          )}
          
          {productColors.map((color) => {
            const count = isAdding
              ? bulkData.filter(v => variantBelongsToColor(v.variant_name, color)).length
              : variantsList.filter(v => variantBelongsToColor(v.variant_name, color)).length
            return (
              <button
                key={color}
                type="button"
                onClick={() => setActiveTab(color)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === color
                    ? 'bg-panel text-ink'
                    : 'text-ink/60 hover:bg-panel2'
                }`}
              >
                {color} ({count})
              </button>
            )
          })}

        </div>
      )}

      {/* SINGLE EDIT FORM */}
      {editingId && (
        <form onSubmit={handleSingleSubmit} className="bg-cream-deep p-4 sm:p-5 rounded-xl border border-cream-line shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-line">
            <h4 className="text-sm font-bold text-ink">Edit Size Option</h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-ink/60 hover:text-ink font-semibold"
            >
              Cancel
            </button>
          </div>
          <div className="space-y-4">
            {/* Responsive Grid: 2 cols on mobile, 4 cols on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 truncate">
                  Size Name
                </label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={formData.variant_name}
                  onChange={(e) => setFormData({ ...formData, variant_name: e.target.value })}
                  className="block w-full rounded-md border-cream-line shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs sm:text-sm px-2.5 py-1.5 sm:py-2 border bg-panel font-bold text-ink"
                  placeholder="e.g. M, L, XL"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 truncate">
                  Price (₹)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="block w-full rounded-md border-cream-line shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs sm:text-sm px-2.5 py-1.5 sm:py-2 border bg-panel"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 truncate">
                  Old Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  className="block w-full rounded-md border-cream-line shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs sm:text-sm px-2.5 py-1.5 sm:py-2 border bg-panel"
                  placeholder="Optional"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 truncate">
                  Stock
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="block w-full rounded-md border-cream-line shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs sm:text-sm px-2.5 py-1.5 sm:py-2 border bg-panel font-bold text-ink"
                />
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-2 border-t border-cream-line">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-cream-line text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="ml-2 text-xs sm:text-sm font-medium text-ink/80">Active</span>
              </label>
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isPending}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-ink/80 bg-panel border border-cream-line rounded-md shadow-sm hover:bg-panel2 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="admin-primary-action px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md cursor-pointer inline-flex items-center"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* BULK ADD FORM */}
      {isAdding && (
        <form onSubmit={handleBulkSubmit} className="bg-cream-deep p-5 rounded-xl border border-cream-line shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-cream-line">
            <div>
              <h4 className="text-sm font-bold text-ink/80">Quick Add Size Options</h4>
              <p className="text-xs text-ink/60 mt-1">Fill in the prices and stock for the standard sizes, or add custom ones.</p>
            </div>
            <button
              type="button"
              onClick={addCustomSizeRow}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Custom Size
            </button>
          </div>

          {activeTab === 'General' && productColors.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 mb-4 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-indigo-900">Apply to All Colors</h5>
                <p className="text-[11px] text-indigo-700 mt-0.5">Fill in the sizes below once, then click Apply to automatically generate these for all colors ({productColors.join(', ')}).</p>
              </div>
              <button
                type="button"
                onClick={handleApplyToAllColors}
                className="admin-primary-action px-4 py-2 text-xs rounded-lg"
              >
                ✨ Apply for All Colors
              </button>
            </div>
          )}

          <div className="space-y-3">
            {/* Headers */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-2">
              <div className="col-span-3 text-xs font-semibold text-ink/60 uppercase tracking-wider">Size Name</div>
              <div className="col-span-2 text-xs font-semibold text-ink/60 uppercase tracking-wider">Price (₹)*</div>
              <div className="col-span-2 text-xs font-semibold text-ink/60 uppercase tracking-wider">Old Price</div>
              <div className="col-span-2 text-xs font-semibold text-ink/60 uppercase tracking-wider">Stock*</div>
              <div className="col-span-2 text-xs font-semibold text-ink/60 uppercase tracking-wider text-center">Active</div>
              <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            {bulkData.filter(row => {
              if (activeTab === 'General') {
                return !productColors.some(color => variantBelongsToColor(row.variant_name, color))
              }
              if (activeTab === 'All') return true
              return variantBelongsToColor(row.variant_name, activeTab)
            }).map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-panel p-3 md:p-2 rounded-lg border border-cream-line shadow-sm items-center">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-ink/60 md:hidden mb-1">Size Name</label>
                  <input
                    type="text"
                    value={extractSizeOnly(row.variant_name)}
                    onChange={(e) => {
                      const colorPrefix = extractColorFromVariant(row.variant_name)
                      const val = e.target.value.trim()
                      updateBulkRow(row.id, 'variant_name', colorPrefix ? `${colorPrefix} - ${val}` : val)
                    }}
                    className="block w-full rounded-md border-cream-line shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border font-bold text-ink"
                    placeholder="e.g. M, L, XL"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-ink/60 md:hidden mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.price}
                    onChange={(e) => updateBulkRow(row.id, 'price', e.target.value)}
                    className="block w-full rounded-md border-cream-line shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-ink/60 md:hidden mb-1">Old Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.original_price}
                    onChange={(e) => updateBulkRow(row.id, 'original_price', e.target.value)}
                    className="block w-full rounded-md border-cream-line shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="Optional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-ink/60 md:hidden mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={row.stock_quantity}
                    onChange={(e) => updateBulkRow(row.id, 'stock_quantity', e.target.value)}
                    className="block w-full rounded-md border-cream-line shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
                <div className="md:col-span-2 flex justify-start md:justify-center items-center mt-2 md:mt-0">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) => updateBulkRow(row.id, 'is_active', e.target.checked)}
                      className="rounded border-cream-line text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="ml-2 text-sm text-ink/60 md:hidden">Active</span>
                  </label>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeBulkRow(row.id)}
                    className="text-ink/40 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                    title="Remove Size"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-cream-line">
            <button
              type="button"
              onClick={resetForm}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-ink/80 bg-panel border border-cream-line rounded-md shadow-sm hover:bg-panel2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || bulkData.length === 0}
              className="admin-primary-action px-6 py-2 text-sm rounded-md"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save All Sizes
            </button>
          </div>
        </form>
      )}

      {variantsList.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile Cards View (sm:hidden) */}
          <div className="sm:hidden space-y-2.5">
            {displayedVariants.map((variant) => (
              <div
                key={variant.id}
                className={`p-3.5 rounded-xl border bg-panel transition-all ${
                  editingId === variant.id
                    ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                    : 'border-cream-line shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2.5 rounded-[5px] bg-[#0B0D0E] text-white font-extrabold text-xs tracking-wider shadow-2xs">
                      {extractSizeOnly(variant.variant_name)}
                    </span>
                    {extractColorFromVariant(variant.variant_name) && (
                      <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {extractColorFromVariant(variant.variant_name)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(variant)}
                      disabled={isPending}
                      className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                      title="Edit Size"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(variant.id)}
                      disabled={isPending}
                      className="text-red-600 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      title="Delete Size"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cream-line/70 text-xs">
                  <div>
                    <span className="text-[10px] text-ink/50 uppercase tracking-wider block font-bold">Price</span>
                    <span className="font-bold text-ink">₹{variant.price}</span>
                    {variant.original_price && (
                      <span className="text-[10px] text-ink/40 line-through ml-1">₹{variant.original_price}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-ink/50 uppercase tracking-wider block font-bold">Stock</span>
                    <span className="font-extrabold text-ink">{variant.stock_quantity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink/50 uppercase tracking-wider block font-bold">Status</span>
                    {variant.is_active ? (
                      <span className="text-[11px] font-bold text-emerald-600">Active</span>
                    ) : (
                      <span className="text-[11px] font-bold text-stone-400">Inactive</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto bg-panel shadow-2xs ring-1 ring-stone-200/90 rounded-xl">
            <table className="min-w-full divide-y divide-cream-line">
              <thead className="bg-cream-deep">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-ink">Size</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-ink">Price</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-ink">Stock</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-ink">Status</th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-line bg-panel">
                {displayedVariants.map((variant) => (
                  <tr key={variant.id} className={editingId === variant.id ? 'bg-indigo-50' : 'hover:bg-panel2 transition-colors'}>
                    <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-sm font-bold text-ink">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2.5 rounded-[5px] bg-[#0B0D0E] text-white font-extrabold text-xs tracking-wider shadow-2xs">
                          {extractSizeOnly(variant.variant_name)}
                        </span>
                        {extractColorFromVariant(variant.variant_name) && (
                          <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            {extractColorFromVariant(variant.variant_name)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-ink/60">
                      <div className="flex flex-col">
                        <span className="font-medium text-ink">₹{variant.price}</span>
                        {variant.original_price && (
                          <span className="text-xs text-ink/40 line-through">₹{variant.original_price}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-ink">
                      {variant.stock_quantity}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-ink/60">
                      {variant.is_active ? (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-cream-deep px-2.5 py-1 text-xs font-medium text-ink/60 ring-1 ring-inset ring-ink/10">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(variant)}
                          disabled={isPending}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Edit Size"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(variant.id)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete Size"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-cream-deep border-2 border-dashed border-cream-line rounded-xl">
          <p className="text-sm font-semibold text-ink/60">No size options added yet.</p>
          <p className="text-sm text-ink/60 mt-2">Add sizes like "S", "M", "L" to this product.</p>
        </div>
      )}
    </div>
  )
}

