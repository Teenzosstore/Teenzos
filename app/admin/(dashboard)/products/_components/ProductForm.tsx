'use client'

import { useTransition, useActionState, useState, useEffect } from 'react'
import { createProduct, updateProduct, type ActionResult } from '@/actions/products'
import { uploadSizeChartImage, type ActionResult as SizeChartActionResult } from '@/actions/size-charts'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon, 
  Loader2, 
  X, 
  Ruler, 
  Plus, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles,
  Tag,
  Check
} from 'lucide-react'
import { ImageKitUploadWidget } from '@/components/ImageKitUploadWidget'
import { useToast } from '@/context/ToastContext'
import type { Category, Product } from '@/types/database'

type OtherProduct = Pick<Product, 'id' | 'name' | 'color_group_id' | 'color_name'>

interface ProductFormProps {
  product?: Product & { product_information?: any[] }
  categories: Category[]
  otherProducts?: OtherProduct[]
  initialJustCreated?: boolean
  hideBottomBar?: boolean
  onColorsChange?: (colorName: string) => void
  initialInformation?: any[]
}

export default function ProductForm({ 
  product, 
  categories, 
  otherProducts = [], 
  initialJustCreated = false,
  hideBottomBar = false,
  onColorsChange,
  initialInformation = []
}: ProductFormProps) {
  const isEditing = !!product
  const action = isEditing ? updateProduct : createProduct
  const { showToast } = useToast()

  const [state, formAction] = useActionState<ActionResult, FormData>(
    action,
    {}
  )
  const [pending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState<string | null>(product?.featured_image_url || null)
  const [imageCloudinaryPublicId, setImageCloudinaryPublicId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Success Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(initialJustCreated)
  const [modalType, setModalType] = useState<'create' | 'update'>(initialJustCreated ? 'create' : 'update')

  // Selling price & MRP state for live discount preview
  const [sellingPrice, setSellingPrice] = useState<string>(product?.price?.toString() || '')
  const [oldPriceVal, setOldPriceVal] = useState<string>(product?.oldPrice?.toString() || '')

  // Selected Badge state for live preview
  const [selectedBadge, setSelectedBadge] = useState<string>(() => {
    if (!product?.badge) return ''
    const lower = product.badge.trim().toLowerCase()
    if (lower === 'new' || lower === 'new arrival' || lower === 'new arrivals') return 'New Arrivals'
    if (lower === 'hot' || lower === 'bestseller' || lower === 'hot bestseller' || lower === 'best seller') return 'Hot Bestseller'
    if (lower === 'trending' || lower === 'on fire') return 'Trending'
    if (lower === 'exclusive' || lower === 'limited' || lower === 'limited edition') return 'Exclusive'
    return product.badge
  })

  // Watch action state updates
  useEffect(() => {
    if (state.success) {
      setModalType('update')
      setShowSuccessModal(true)
      showToast('Product updated successfully in Supabase!', 'success')
    } else if (state.error) {
      showToast(state.error, 'error')
    }
  }, [state, showToast])

  // Watch initialJustCreated
  useEffect(() => {
    if (initialJustCreated) {
      setModalType('create')
      setShowSuccessModal(true)
      showToast('Product created successfully in Supabase!', 'success')
    }
  }, [initialJustCreated, showToast])

  // Parse initial colors from JSON or legacy format
  const initialColors = (() => {
    if (!product?.color_name) return []
    try {
      if (product.color_name.startsWith('[')) {
        return JSON.parse(product.color_name) as { name: string; hex: string }[]
      }
    } catch (e) {}
    // Fallback for legacy comma-separated values
    return product.color_name.split(',').map(c => ({ name: c.trim(), hex: '#1E3B2E' })).filter(c => c.name)
  })()

  const [colorsList, setColorsList] = useState<{ name: string; hex: string }[]>(initialColors)
  const [colorInputName, setColorInputName] = useState('')
  const [colorInputHex, setColorInputHex] = useState('#0B0D0E')

  // Size Chart state: 'global' | 'custom' | 'disabled'
  const initialSizeChartMode = (() => {
    if (!product) return 'global'
    if (
      product.size_chart_image_url === 'disabled' ||
      (product.use_global_size_chart === false && (!product.size_chart_image_url || product.size_chart_image_url === ''))
    ) {
      return 'disabled'
    }
    if (product.use_global_size_chart === false) {
      return 'custom'
    }
    return 'global'
  })()

  const [sizeChartMode, setSizeChartMode] = useState<'global' | 'custom' | 'disabled'>(initialSizeChartMode)
  const [sizeChartImageUrl, setSizeChartImageUrl] = useState<string | null>(
    product?.size_chart_image_url === 'disabled' ? null : (product?.size_chart_image_url || null)
  )
  const [sizeChartCloudinaryId, setSizeChartCloudinaryId] = useState<string | null>(
    product?.size_chart_cloudinary_public_id === 'disabled' ? null : (product?.size_chart_cloudinary_public_id || null)
  )
  const [isSizeChartUploading, setIsSizeChartUploading] = useState(false)
  const [sizeChartUploadState] = useActionState<SizeChartActionResult, FormData>(
    uploadSizeChartImage,
    {}
  )

  const handleSizeChartUploadSuccess = (result: any) => {
    setSizeChartImageUrl(result.url)
    setSizeChartCloudinaryId(result.fileId)
    setIsSizeChartUploading(false)
  }

  const handleSizeChartUploadOpen = () => setIsSizeChartUploading(true)
  const handleSizeChartUploadError = () => setIsSizeChartUploading(false)

  // Initial features / checklist with checkmarks (from product_information table or product data)
  const initialFeatures = (() => {
    // 1. From initialInformation prop or product.product_information
    const infoArray = (initialInformation && initialInformation.length > 0)
      ? initialInformation
      : ((product as any)?.product_information || [])

    if (Array.isArray(infoArray) && infoArray.length > 0) {
      const keyFeats = infoArray
        .filter((i: any) => i.label === 'Key Feature' || i.label === 'Feature')
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((i: any) => i.value)
        .filter(Boolean)
      if (keyFeats.length > 0) return keyFeats
    }

    // 2. From product.features
    if ((product as any)?.features && Array.isArray((product as any).features) && (product as any).features.length > 0) {
      return (product as any).features
    }

    // 3. Fallback for legacy JSON in short_description
    if (product?.short_description) {
      try {
        if (product.short_description.startsWith('{')) {
          const parsed = JSON.parse(product.short_description)
          if (Array.isArray(parsed.features)) return parsed.features
        } else if (product.short_description.startsWith('[')) {
          const parsed = JSON.parse(product.short_description)
          if (Array.isArray(parsed)) return parsed
        }
      } catch (e) {}
    }
    return []
  })()

  const [featuresList, setFeaturesList] = useState<string[]>(initialFeatures)
  const [newFeatureInput, setNewFeatureInput] = useState('')

  const handleAddFeature = (text?: string) => {
    const val = (text || newFeatureInput).trim()
    if (!val) return
    if (!featuresList.includes(val)) {
      setFeaturesList((prev) => [...prev, val])
    }
    if (!text) setNewFeatureInput('')
  }

  const handleRemoveFeature = (idx: number) => {
    setFeaturesList((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleAddColor = () => {
    const name = colorInputName.trim()
    if (!name) return
    if (colorsList.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return
    }
    const nextColors = [...colorsList, { name, hex: colorInputHex }]
    setColorsList(nextColors)
    onColorsChange?.(JSON.stringify(nextColors))
    setColorInputName('')
  }

  const handleRemoveColor = (nameToRemove: string) => {
    const nextColors = colorsList.filter(c => c.name !== nameToRemove)
    setColorsList(nextColors)
    onColorsChange?.(JSON.stringify(nextColors))
  }

  // Calculate discount percentage
  const numPrice = parseFloat(sellingPrice) || 0
  const numOldPrice = parseFloat(oldPriceVal) || 0
  const discountPercent = numPrice > 0 && numOldPrice > numPrice
    ? Math.round(((numOldPrice - numPrice) / numOldPrice) * 100)
    : 0

  return (
    <div className="relative">
      {/* ─── STICKY TOP ACTION BAR (Full Width & Responsive) ───────────────── */}
      <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 shadow-xs mb-5">
        <div className="w-full flex items-center justify-between gap-2.5 sm:gap-4">
          <Link
            href="/admin/products"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 hover:text-black hover:bg-stone-100 transition-all border border-stone-200/90 bg-white shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
            <span>Back to Products</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isEditing ? 'bg-emerald-500 animate-pulse' : 'bg-[#F72585]'}`} />
            <span className="text-xs font-semibold text-stone-600 truncate max-w-[200px] lg:max-w-xs">
              {isEditing ? `Editing: ${product?.name || 'Product'}` : 'Creating New Product'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
            {isEditing && product?.slug && (
              <a
                href={`/shop/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-[#F72585] hover:bg-stone-100 transition-all border border-stone-200 bg-white"
              >
                <span>View Store</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              type="submit"
              form="product-form"
              disabled={pending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-white bg-[#0B0D0E] hover:bg-[#F72585] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditing ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── FORM CONTENT ─────────────────────────────────────────────── */}
      <form
        id="product-form"
        action={(formData) => startTransition(() => formAction(formData))}
        className="space-y-5"
      >
        {isEditing && <input type="hidden" name="id" value={product.id} />}

        {/* Error notification */}
        {state.error && (
          <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center justify-between gap-3">
            <span className="font-semibold">{state.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Main Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Card 1: Basic Details */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#0B0D0E] text-white text-[11px] font-black flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-[#0B0D0E]">
                    Basic Information
                  </h2>
                </div>
                <span className="text-[11px] text-stone-400 font-medium">* Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label
                    htmlFor="product-name"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
                  >
                    Product Name <span className="text-[#F72585]">*</span>
                  </label>
                  <input
                    id="product-name"
                    name="name"
                    type="text"
                    required
                    maxLength={255}
                    defaultValue={product?.name || ''}
                    placeholder="e.g. Acid Wash Skull Graphic Oversized Tee"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] transition-all"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Slug will automatically generate from name.
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="product-category"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
                  >
                    Category <span className="text-[#F72585]">*</span>
                  </label>
                  <select
                    id="product-category"
                    name="category_id"
                    required
                    defaultValue={product?.category_id || ''}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] transition-all"
                  >
                    <option value="">Select a category</option>
                    <optgroup label="👕 Apparel & Streetwear Categories">
                      {categories
                        .filter(
                          (cat) =>
                            !['new-arrivals', 'bestseller', 'trending', 'exclusive'].includes(
                              cat.id
                            )
                        )
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Select a streetwear drop category.
                  </p>
                </div>
              </div>

              {/* Selling Price, MRP & Initial Stock */}
              <div className={`grid grid-cols-1 ${isEditing ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4 pt-1`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="product-price"
                      className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                    >
                      Selling Price (₹) <span className="text-[#F72585]">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-600 font-bold">Live Store Price</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm">
                      ₹
                    </span>
                    <input
                      id="product-price"
                      name="price"
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="1499"
                      className="w-full pl-8 pr-3.5 py-2 text-sm font-semibold rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="product-old-price"
                      className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                    >
                      Original MRP / Compare (₹)
                    </label>
                    {discountPercent > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm">
                      ₹
                    </span>
                    <input
                      id="product-old-price"
                      name="oldPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={oldPriceVal}
                      onChange={(e) => setOldPriceVal(e.target.value)}
                      placeholder="1999"
                      className="w-full pl-8 pr-3.5 py-2 text-sm font-semibold rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Shows strikethrough price on storefront cards.
                  </p>
                </div>

                {!isEditing && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="product-initial-stock"
                        className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                      >
                        Stock (All Sizes)
                      </label>
                      <span className="text-[11px] text-[#F72585] font-bold">Same for all sizes</span>
                    </div>
                    <div className="relative">
                      <input
                        id="product-initial-stock"
                        name="initial_stock"
                        type="number"
                        min="0"
                        defaultValue="10"
                        placeholder="10"
                        className="w-full px-3.5 py-2 text-sm font-semibold rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Sets same stock across S, M, L, XL, XXL.
                    </p>
                  </div>
                )}
              </div>

              {/* Short Description */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="product-short-description"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                  >
                    Short Description
                  </label>
                  <span className="text-[11px] text-stone-400 font-medium">
                    1-2 lines shown below price
                  </span>
                </div>
                <textarea
                  id="product-short-description"
                  name="short_description"
                  rows={2}
                  maxLength={500}
                  defaultValue={
                    (() => {
                      if (!product?.short_description) return ''
                      try {
                        if (product.short_description.startsWith('{')) {
                          const parsed = JSON.parse(product.short_description)
                          return parsed.bio || ''
                        }
                        if (product.short_description.startsWith('[')) return ''
                      } catch (e) {}
                      return product.short_description
                    })()
                  }
                  placeholder="e.g. Heavyweight 380 GSM cotton fleece streetwear hoodie with signature street drop aesthetics and relaxed oversized fit."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] transition-all leading-relaxed resize-y"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Brief bio / summary displayed right beneath the price on the storefront.
                </p>
              </div>

              {/* Full Description */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="product-description"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                  >
                    Full Description
                  </label>
                  <span className="text-[11px] text-stone-400 font-medium">
                    Story & Styling Narrative
                  </span>
                </div>
                <textarea
                  id="product-description"
                  name="description"
                  rows={8}
                  maxLength={5000}
                  defaultValue={product?.description || ''}
                  placeholder="Describe the fabric, drop concept, streetwear inspiration, and styling suggestions..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] transition-all leading-relaxed resize-y"
                />
              </div>


              {/* Key Features & Bullet Points (✓ Checkmarks) */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Key Highlights (with ✓ Checkmarks)
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFE1ED] text-[#F72585]">
                      {featuresList.length} Highlights
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-500 -mt-1">
                  Appears alongside product details with pink checkmark badges.
                </p>

                {/* Input for Custom Feature */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddFeature()
                      }
                    }}
                    placeholder="Type custom highlight (e.g. 100% Heavyweight Cotton) and press Enter..."
                    className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddFeature()}
                    className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-black transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Highlight</span>
                  </button>
                </div>

                {/* Popular Highlight Suggestions (Click to Add) */}
                <div className="flex items-center gap-1.5 flex-wrap bg-[#FAF9F8] p-2.5 rounded-lg border border-stone-200/80">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">
                    Select to Add:
                  </span>
                  {[
                    '100% Premium Cotton Blend',
                    'Heavyweight 380+ GSM Terry',
                    'Oversized Boxy Streetwear Cut',
                    'High-Density Puff Print',
                    'Ribbed Collar & Hem',
                    'Twin-Needle Reinforced Seams',
                    'Pre-Shrunk Breathable Fabric',
                  ].map((preset) => {
                    const isAdded = featuresList.includes(preset)
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddFeature(preset)}
                        disabled={isAdded}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 border ${
                          isAdded
                            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-default opacity-60'
                            : 'bg-white text-stone-700 hover:text-[#F72585] hover:border-[#F72585]/40 border-stone-200 shadow-2xs cursor-pointer'
                        }`}
                      >
                        {isAdded ? (
                          <Check className="w-2.5 h-2.5 text-emerald-500 stroke-[3]" />
                        ) : (
                          <Plus className="w-2.5 h-2.5 text-[#F72585]" />
                        )}
                        <span>{preset}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Selected Highlights List Cards */}
                {featuresList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {featuresList.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-stone-200/90 shadow-2xs group hover:border-stone-300 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-4 h-4 rounded-[4px] bg-[#FFF0F6] border border-[#FF007A] flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#FF007A] stroke-[3]" />
                          </div>
                          <span className="text-xs font-bold text-stone-800 truncate" title={feat}>
                            {feat}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-stone-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                          title="Remove highlight"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-lg border border-dashed border-stone-200 bg-stone-50">
                    <p className="text-xs text-stone-500 font-medium">No highlights added for this product yet.</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Type a custom highlight above or select from the options to add.</p>
                  </div>
                )}

                {/* Hidden input storing JSON array */}
                <input
                  type="hidden"
                  name="features_json"
                  value={JSON.stringify(featuresList)}
                />
              </div>
            </div>

            {/* Card 2: Size Chart Settings */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#0B0D0E] text-white text-[11px] font-black flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-[#0B0D0E]">
                    Size Chart
                  </h2>
                </div>
                
                {/* Active / Disabled Status Pill */}
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  sizeChartMode === 'disabled'
                    ? 'bg-stone-100 text-stone-500 border border-stone-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sizeChartMode === 'disabled' ? 'bg-stone-400' : 'bg-emerald-500 animate-pulse'}`} />
                  {sizeChartMode === 'disabled' ? 'Disabled' : 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Global Standard */}
                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  sizeChartMode === 'global'
                    ? 'border-stone-900 bg-stone-50/50 shadow-2xs ring-1 ring-stone-900/10'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <input
                      type="radio"
                      name="size_chart_mode_choice"
                      value="global"
                      checked={sizeChartMode === 'global'}
                      onChange={() => setSizeChartMode('global')}
                      className="w-4 h-4 text-[#0B0D0E] focus:ring-[#0B0D0E]"
                    />
                    <span className="text-xs font-bold text-stone-900">
                      Standard Global Chart
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 pl-6 leading-tight">
                    Active • Storewide interactive chart
                  </span>
                </label>

                {/* 2. Custom Upload */}
                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  sizeChartMode === 'custom'
                    ? 'border-stone-900 bg-stone-50/50 shadow-2xs ring-1 ring-stone-900/10'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <input
                      type="radio"
                      name="size_chart_mode_choice"
                      value="custom"
                      checked={sizeChartMode === 'custom'}
                      onChange={() => setSizeChartMode('custom')}
                      className="w-4 h-4 text-[#0B0D0E] focus:ring-[#0B0D0E]"
                    />
                    <span className="text-xs font-bold text-stone-900">
                      Custom Chart Image
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 pl-6 leading-tight">
                    Active • Upload specific diagram
                  </span>
                </label>

                {/* 3. Disabled Option */}
                <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  sizeChartMode === 'disabled'
                    ? 'border-red-500 bg-red-50/30 shadow-2xs ring-1 ring-red-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <input
                      type="radio"
                      name="size_chart_mode_choice"
                      value="disabled"
                      checked={sizeChartMode === 'disabled'}
                      onChange={() => setSizeChartMode('disabled')}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs font-bold text-stone-900">
                      Disable Size Chart
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 pl-6 leading-tight">
                    Inactive • Hidden on storefront
                  </span>
                </label>
              </div>

              {sizeChartMode === 'disabled' && (
                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center gap-2 text-stone-600 text-xs">
                  <span className="text-amber-500 font-bold">ℹ</span>
                  <span>Size Chart disabled hai. Frontend me &quot;Size Guide&quot; button aur &quot;Size &amp; Fit&quot; tab hide rahenge.</span>
                </div>
              )}

              {sizeChartMode === 'custom' && (
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Custom Chart Image
                  </label>
                  {sizeChartImageUrl ? (
                    <div className="relative w-full max-w-sm aspect-video rounded-xl border border-stone-200 overflow-hidden bg-stone-50">
                      <Image
                        src={sizeChartImageUrl}
                        alt="Size Chart Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSizeChartImageUrl(null)
                          setSizeChartCloudinaryId(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-white text-stone-800 hover:text-red-600 rounded-md shadow-xs transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <ImageKitUploadWidget
                      options={{
                        maxFiles: 1,
                        folder: "teenzos/size-charts",
                        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"]
                      }}
                      onSuccess={handleSizeChartUploadSuccess}
                      onOpen={handleSizeChartUploadOpen}
                      onError={handleSizeChartUploadError}
                      onClose={() => setIsSizeChartUploading(false)}
                    >
                      {({ open, isUploading: widgetUploading }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          disabled={isSizeChartUploading || widgetUploading}
                          className="w-full max-w-sm aspect-video flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-600 hover:border-[#F72585] hover:text-[#F72585] transition-all cursor-pointer"
                        >
                          {isSizeChartUploading || widgetUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#F72585]" />
                          ) : (
                            <ImageIcon className="w-5 h-5" />
                          )}
                          <span className="text-xs font-semibold">Upload Custom Chart</span>
                        </button>
                      )}
                    </ImageKitUploadWidget>
                  )}
                </div>
              )}

              {/* Hidden fields */}
              <input type="hidden" name="use_global_size_chart" value={(sizeChartMode === 'global').toString()} />
              <input
                type="hidden"
                name="size_chart_image_url"
                value={
                  sizeChartMode === 'disabled'
                    ? 'disabled'
                    : sizeChartMode === 'custom'
                    ? (sizeChartImageUrl || '')
                    : ''
                }
              />
              <input
                type="hidden"
                name="size_chart_cloudinary_public_id"
                value={
                  sizeChartMode === 'custom'
                    ? (sizeChartCloudinaryId || '')
                    : ''
                }
              />
            </div>

            {/* Card 3: SEO Optimization */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#0B0D0E] text-white text-[11px] font-black flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-[#0B0D0E]">
                    Search Engine Optimization (SEO)
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="seo-title"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
                  >
                    SEO Meta Title
                  </label>
                  <input
                    id="seo-title"
                    name="seo_title"
                    type="text"
                    maxLength={200}
                    defaultValue={product?.seo_title || ''}
                    placeholder="Custom meta title for Google & Social shares"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="seo-description"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
                  >
                    SEO Meta Description
                  </label>
                  <textarea
                    id="seo-description"
                    name="seo_description"
                    rows={2}
                    maxLength={500}
                    defaultValue={product?.seo_description || ''}
                    placeholder="Brief 150-160 character snippet for search results"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] resize-y"
                  />
                </div>

                <div>
                  <label
                    htmlFor="seo-keywords"
                    className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
                  >
                    SEO Keywords (comma separated)
                  </label>
                  <input
                    id="seo-keywords"
                    name="seo_keywords"
                    type="text"
                    defaultValue={product?.seo_keywords || ''}
                    placeholder="oversized tee, graphic tshirt, streetwear drop, puff print"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column (1 Col) */}
          <div className="lg:col-span-1 space-y-5">
            {/* Sidebar Card 1: Status & Curated Badges */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-sm font-bold text-[#0B0D0E] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#F72585]" />
                  <span>Status & Badges</span>
                </h2>
              </div>

              {/* Active Toggle Switch */}
              <input type="hidden" name="is_active_submitted" value="true" />
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F8] border border-stone-200/80">
                <div>
                  <label
                    htmlFor="product-active"
                    className="block text-xs font-bold text-stone-900 cursor-pointer"
                  >
                    Storefront Visibility
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Live and searchable for customers
                  </p>
                </div>
                <input
                  id="product-active"
                  name="is_active"
                  type="checkbox"
                  defaultChecked={product?.is_active ?? true}
                  className="w-4 h-4 rounded text-[#F72585] focus:ring-[#F72585] cursor-pointer"
                />
              </div>

              {/* Featured Drop Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F8] border border-stone-200/80">
                <div>
                  <label
                    htmlFor="product-featured"
                    className="block text-xs font-bold text-stone-900 cursor-pointer"
                  >
                    Featured Drop
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Pin to homepage spotlight &amp; featured filters
                  </p>
                </div>
                <input
                  id="product-featured"
                  name="is_featured"
                  type="checkbox"
                  defaultChecked={product?.is_featured ?? false}
                  className="w-4 h-4 rounded text-[#F72585] focus:ring-[#F72585] cursor-pointer"
                />
              </div>

              {/* Curated Storefront Badges */}
              <div>
                <label
                  htmlFor="product-badge"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
                >
                  Status Badge / Tag
                </label>
                <select
                  id="product-badge"
                  name="badge"
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] transition-all"
                >
                  <option value="">No Badge</option>
                  <optgroup label="🔥 Curated Badges (Storefront Filter)">
                    <option value="New Arrivals">New Arrivals</option>
                    <option value="Hot Bestseller">Hot Bestseller</option>
                    <option value="Trending">Trending</option>
                    <option value="Exclusive">Exclusive</option>
                  </optgroup>
                </select>

                {/* Badge Visual Preview */}
                {selectedBadge && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-medium">Card Tag Preview:</span>
                    <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-md uppercase bg-[#0B0D0E] text-white shadow-2xs">
                      {selectedBadge}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                  Badges link directly to category filters and collection rows on homepage.
                </p>
              </div>
            </div>

            {/* Sidebar Card 2: Color Swatches */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F72585]" />
                  <h2 className="text-sm font-bold text-[#0B0D0E]">
                    Product Colors
                  </h2>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {colorsList.length} Colors
                </span>
              </div>
              <p className="text-xs text-stone-500 -mt-1">
                Colors generate tabs for gallery images and size variants.
              </p>

              {/* Color List */}
              {colorsList.length > 0 ? (
                <div className="space-y-2 p-2.5 bg-[#FAF9F8] rounded-xl border border-stone-200/80">
                  {colorsList.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 shrink-0 shadow-2xs"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs font-bold text-stone-800 truncate" title={c.name}>
                          {c.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveColor(c.name)}
                        className="text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors p-1 rounded-md cursor-pointer"
                        title="Remove color"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center rounded-lg border border-dashed border-stone-200 bg-stone-50">
                  <p className="text-xs text-stone-400">No color swatches added yet</p>
                </div>
              )}

              {/* Add Color Form */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={colorInputName}
                    onChange={(e) => setColorInputName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddColor()
                      }
                    }}
                    placeholder="Color (e.g. Vintage Black)"
                    className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-[#FCFBFA] focus:bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585]"
                  />
                  <input
                    type="color"
                    value={colorInputHex}
                    onChange={(e) => setColorInputHex(e.target.value)}
                    className="w-8 h-8 rounded-md border border-stone-200 cursor-pointer shrink-0 p-0.5 bg-white"
                    title="Pick hex color"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    Add Color
                  </button>
                </div>
              </div>

              {/* Hidden JSON input */}
              <input type="hidden" name="color_name" value={JSON.stringify(colorsList)} />
            </div>

            {/* Sidebar Card 3: Main Product Image */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-stone-700" />
                  <h2 className="text-sm font-bold text-[#0B0D0E]">
                    Main Cover Image
                  </h2>
                </div>
              </div>
              <p className="text-xs text-stone-500 -mt-1">
                Default primary image shown on catalog grids.
              </p>

              <input type="hidden" name="image_url" value={imageUrl || ''} />
              <input type="hidden" name="cloudinary_public_id" value={imageCloudinaryPublicId || ''} />

              {imageUrl ? (
                <div className="relative w-full aspect-square rounded-xl border border-stone-200 overflow-hidden bg-stone-50">
                  <Image
                    src={imageUrl}
                    alt="Featured Image Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(null)
                      setImageCloudinaryPublicId(null)
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-stone-800 hover:text-red-600 rounded-lg shadow-xs transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <ImageKitUploadWidget
                  options={{
                    maxFiles: 1,
                    folder: "teenzos/products",
                    clientAllowedFormats: ["jpg", "jpeg", "png", "webp"]
                  }}
                  onSuccess={(result) => {
                    setImageUrl(result.url)
                    setImageCloudinaryPublicId(result.fileId || null)
                    setIsUploading(false)
                  }}
                  onOpen={() => setIsUploading(true)}
                  onError={() => setIsUploading(false)}
                  onClose={() => setIsUploading(false)}
                >
                  {({ open, isUploading: widgetUploading }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      disabled={isUploading || widgetUploading || pending}
                      className="w-full aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-600 hover:border-[#F72585] hover:text-[#F72585] transition-all cursor-pointer p-4"
                    >
                      {isUploading || widgetUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-[#F72585]" />
                      ) : (
                        <ImageIcon className="w-6 h-6" />
                      )}
                      <span className="text-xs font-semibold text-center">
                        Upload Main Product Cover
                      </span>
                    </button>
                  )}
                </ImageKitUploadWidget>
              )}
            </div>
          </div>
        </div>

        {/* ─── STICKY BOTTOM ACTION BAR (When not hidden by parent - Full Width & Responsive) ─── */}
        {!hideBottomBar && (
          <div className="sticky -bottom-4 sm:-bottom-6 lg:-bottom-8 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/90 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 shadow-xl mt-6">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
              {/* Mobile Sync Indicator */}
              <div className="flex sm:hidden items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>⚡ Changes sync instantly with Supabase database</span>
              </div>

              {/* Action Buttons Row */}
              <div className="w-full flex items-center justify-between gap-2.5 sm:gap-4">
                <Link
                  href="/admin/products"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 hover:text-black hover:bg-stone-100 transition-all border border-stone-200/90 bg-white shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
                  <span>Back to Products</span>
                </Link>

                {/* Desktop Sync Indicator */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>⚡ Changes sync instantly with Supabase database</span>
                </div>

                <button
                  type="submit"
                  form="product-form"
                  disabled={pending}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-[#0B0D0E] hover:bg-[#F72585] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isEditing ? 'Update Product' : 'Create Product'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* ─── POPUP SUCCESS MODAL DIALOG ──────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 text-center transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#0B0D0E]">
              {modalType === 'create'
                ? 'Product Created Successfully!'
                : 'Product Updated Successfully!'}
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              {modalType === 'create'
                ? 'Your new product details, price, highlights and colors have been stored in Supabase. You can now add size variants and gallery photos.'
                : 'All changes including prices, badges, descriptions, bullet points and SEO have been updated in Supabase in real-time.'}
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/admin/products"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Product List</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0D0E] text-white text-xs sm:text-sm font-bold hover:bg-[#F72585] transition-colors shadow-sm cursor-pointer"
              >
                Continue Editing
              </button>
            </div>

            {product?.slug && (
              <div className="mt-4 pt-3 border-t border-stone-100">
                <a
                  href={`/shop/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#F72585] hover:underline font-bold"
                >
                  <span>View live product on storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
