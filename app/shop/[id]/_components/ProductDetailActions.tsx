'use client'

import React, { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap, Plus, Minus, Ruler, Truck, ShieldCheck, RotateCcw, Heart, Check, Star } from 'lucide-react'
import SizeChartPopup from './SizeChartPopup'

export type ProductVariant = {
  id: string
  variant_name: string
  price: number
  original_price: number | null
  stock_quantity: number
  is_active?: boolean
}

type ProductDetailActionsProps = {
  product: {
    id: string
    name: string
    badge?: string | null
    rating?: number | null
    review_count?: number
    sold_count?: string
    short_description?: any
    image_url: string
    category_name?: string
    colors: { name: string; hex: string }[]
    variants: ProductVariant[]
    sizeChart?: {
      imageUrl: string
      title: string
    } | null
  }
  selectedColor: string | null
  onColorChange: (colorName: string) => void
}

export default function ProductDetailActions({
  product,
  selectedColor,
  onColorChange,
}: ProductDetailActionsProps) {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const router = useRouter()

  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<string>('L')
  const [showSizeChart, setShowSizeChart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddedSuccess, setIsAddedSuccess] = useState(false)

  // Extract clean bio text if short_description is stored as JSON or object
  const cleanShortDescription = (() => {
    const raw = product.short_description
    if (!raw) return null
    if (typeof raw === 'object') {
      return (raw as any).bio || null
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed)
          return parsed.bio || null
        } catch {
          return null
        }
      }
      if (trimmed.startsWith('[')) return null
      return trimmed
    }
    return null
  })()

  // Initialize wishlist from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('teenzos_wishlist')
      if (saved) {
        const parsed = JSON.parse(saved)
        setIsWishlisted(!!parsed[product.id])
      }
    } catch {}

    const handleWishlistChange = () => {
      try {
        const saved = localStorage.getItem('teenzos_wishlist')
        if (saved) {
          const parsed = JSON.parse(saved)
          setIsWishlisted(!!parsed[product.id])
        }
      } catch {}
    }

    window.addEventListener('teenzos-wishlist-change', handleWishlistChange)
    return () => window.removeEventListener('teenzos-wishlist-change', handleWishlistChange)
  }, [product.id])

  const handleToggleWishlist = () => {
    try {
      let currentMap: Record<string, boolean> = {}
      const saved = localStorage.getItem('teenzos_wishlist')
      if (saved) {
        try {
          currentMap = JSON.parse(saved)
        } catch {}
      }

      const next = !currentMap[product.id]
      currentMap[product.id] = next
      localStorage.setItem('teenzos_wishlist', JSON.stringify(currentMap))

      // Also cache product snapshot
      let cachedProducts: Record<string, any> = {}
      try {
        const raw = localStorage.getItem('teenzos_wishlist_products')
        if (raw) cachedProducts = JSON.parse(raw)
      } catch {}
      if (next) {
        cachedProducts[product.id] = {
          id: product.id,
          name: product.name,
          slug: (product as any).slug || product.id,
          category_name: product.category_name,
          price: currentPrice,
          oldPrice: currentOldPrice,
          discount: `${discountPercentage}% OFF`,
          image_url: product.image_url,
          badge: product.badge,
          sizes: availableSizes,
        }
      } else {
        delete cachedProducts[product.id]
      }
      localStorage.setItem('teenzos_wishlist_products', JSON.stringify(cachedProducts))

      setIsWishlisted(next)

      setTimeout(() => {
        window.dispatchEvent(new Event('teenzos-wishlist-change'))
      }, 0)

      if (next) {
        showToast('Saved to your wishlist!', 'success')
      } else {
        showToast('Removed from wishlist', 'info')
      }
    } catch (e) {
      console.error('Wishlist error in product details:', e)
    }
  }

  // Helper to extract clean size only (e.g. "Black - M" -> "M")
  const extractSizeOnly = (name: string): string => {
    if (!name) return ''
    const trimmed = name.trim()
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

  const CANONICAL_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL']

  // Extract clean available sizes (only S, M, L, XL - no color names)
  const availableSizes = React.useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return ['S', 'M', 'L', 'XL', 'XXL']
    }

    let relevantVariants = product.variants
    if (selectedColor) {
      const colorSpecific = product.variants.filter((v) =>
        v.variant_name.toLowerCase().includes(selectedColor.toLowerCase())
      )
      if (colorSpecific.length > 0) {
        relevantVariants = colorSpecific
      }
    }

    const rawCleanSizes = Array.from(
      new Set(relevantVariants.map((v) => extractSizeOnly(v.variant_name)).filter(Boolean))
    )

    if (rawCleanSizes.length === 0) {
      return ['S', 'M', 'L', 'XL', 'XXL']
    }

    return rawCleanSizes.sort((a, b) => {
      const idxA = CANONICAL_SIZE_ORDER.indexOf(a.toUpperCase())
      const idxB = CANONICAL_SIZE_ORDER.indexOf(b.toUpperCase())
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    })
  }, [product.variants, selectedColor])

  // Set default selected size if current isn't in availableSizes
  React.useEffect(() => {
    const isCurrentValid = availableSizes.some(
      (s) => s.toUpperCase() === selectedSize.toUpperCase()
    )
    if (!isCurrentValid && availableSizes.length > 0) {
      const hasL = availableSizes.find((s) => s.toUpperCase() === 'L')
      const hasM = availableSizes.find((s) => s.toUpperCase() === 'M')
      setSelectedSize(hasL || hasM || availableSizes[0])
    }
  }, [availableSizes, selectedSize])

  // Get active variant price based on pure size & selected color
  const activeVariant = React.useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null
    return (
      product.variants.find((v) => {
        const pure = extractSizeOnly(v.variant_name).toLowerCase()
        const match = pure === selectedSize.toLowerCase()
        if (!selectedColor) return match
        return match && v.variant_name.toLowerCase().includes(selectedColor.toLowerCase())
      }) ||
      product.variants.find(
        (v) => extractSizeOnly(v.variant_name).toLowerCase() === selectedSize.toLowerCase()
      ) ||
      product.variants[0]
    )
  }, [product.variants, selectedSize, selectedColor])

  const currentPrice = activeVariant ? activeVariant.price : 1999
  const currentOldPrice = activeVariant?.original_price || 2499
  const discountPercentage = currentOldPrice
    ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
    : 20

  const currentStock = activeVariant !== null && activeVariant !== undefined
    ? Number(activeVariant.stock_quantity ?? 0)
    : 10
  const isOutOfStock = activeVariant !== null && currentStock <= 0
  const isLowStock = !isOutOfStock && currentStock <= 5

  const handleAdd = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (isOutOfStock) return
    addToCart(
      {
        id: product.id,
        name: `${product.name}${selectedColor ? ` (${selectedColor})` : ''}`,
        price: currentPrice,
        image_url: product.image_url,
        category_name: product.category_name,
        variant_id: activeVariant?.id || `${product.id}-${selectedSize.toLowerCase()}`,
        variant_name: `${selectedSize}${selectedColor ? ` / ${selectedColor}` : ''}`,
      },
      {
        event: e,
        sourceElement: e?.currentTarget,
      }
    )

    setIsAddedSuccess(true)
    setTimeout(() => {
      setIsAddedSuccess(false)
    }, 1800)
  }

  // Live rating stats (defaults to 5.0 with 5 stars and (0), updates dynamically when reviews exist)
  const [liveReviewCount, setLiveReviewCount] = useState<number>(Number(product.review_count) || 0)
  const [liveRating, setLiveRating] = useState<number>(Number(product.rating) || 0)

  React.useEffect(() => {
    setLiveReviewCount(Number(product.review_count) || 0)
    setLiveRating(Number(product.rating) || 0)
  }, [product.review_count, product.rating])

  React.useEffect(() => {
    const handleNewReview = (e: any) => {
      const addedRating = Number(e?.detail?.rating) || 5
      setLiveReviewCount((prev) => {
        const nextCount = prev + 1
        setLiveRating((prevRating) => {
          if (prev === 0) return addedRating
          return Number(((prevRating * prev + addedRating) / nextCount).toFixed(1))
        })
        return nextCount
      })
    }
    window.addEventListener('teenzos-review-added', handleNewReview)
    return () => window.removeEventListener('teenzos-review-added', handleNewReview)
  }, [])

  const displayRating = liveReviewCount > 0 && liveRating > 0 ? liveRating : 5

  const handleBuyNow = () => {
    if (isOutOfStock) return
    handleAdd()
    router.push('/checkout')
  }

  return (
    <div className="space-y-3 lg:space-y-3">
      {/* 2. Product Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
          {product.name}
        </h1>
      </div>

      {/* 3. Rating & Sold Stats (Default 5 stars with (0), updates dynamically with reviews) */}
      <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('teenzos-open-reviews-tab'))
          }}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer text-left group"
          title="View customer reviews"
        >
          <div className="flex items-center gap-0.5 text-[#F59E0B]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-105 ${
                  star <= Math.round(displayRating)
                    ? 'fill-[#F59E0B] text-[#F59E0B]'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="font-bold text-gray-900 leading-none">
            {displayRating.toFixed(1)}
          </span>
          <span className="text-gray-500 font-medium leading-none group-hover:text-[#FF007A] transition-colors">
            ({liveReviewCount})
          </span>
        </button>
        {product.sold_count && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-700 font-semibold leading-none">{product.sold_count}</span>
          </>
        )}
      </div>

      {/* 4. Price Block with In Stock / Stock Status Badge */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        <span className="text-3xl sm:text-4xl font-black text-[#FF007A]">
          ₹{currentPrice.toLocaleString('en-IN')}
        </span>
        {currentOldPrice && (
          <span className="text-lg sm:text-xl text-gray-400 line-through font-semibold">
            ₹{currentOldPrice.toLocaleString('en-IN')}
          </span>
        )}
        <span className="bg-[#FFF0F6] text-[#FF007A] text-xs font-black px-2.5 py-1 rounded-md border border-[#FF007A]/25">
          {discountPercentage}% OFF
        </span>

        {/* Stock Status Badge right next to MRP */}
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-extrabold border border-rose-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span>Out of Stock</span>
          </span>
        ) : isLowStock ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-extrabold border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Only {currentStock} left!</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>In Stock</span>
          </span>
        )}
      </div>

      {/* 5. Short Description / Bio */}
      {cleanShortDescription && (
        <p className="text-gray-600 text-sm sm:text-[15px] leading-relaxed">
          {cleanShortDescription}
        </p>
      )}

      <hr className="border-gray-200/80 my-4" />

      {/* 6. Color Selection Swatches & Size Guide */}
      {product.colors && product.colors.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <span className="text-gray-500 font-medium">Color:</span>
              <span className="text-gray-950 font-bold">{selectedColor || product.colors[0]?.name}</span>
            </div>

            {product.sizeChart?.imageUrl && (
              <button
                type="button"
                onClick={() => setShowSizeChart(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-[#FF007A] transition-colors cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5 text-[#FF007A]" />
                <span>Size Guide</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {product.colors.map((c) => {
              const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase()
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onColorChange(c.name)}
                  aria-label={`Select color ${c.name}`}
                  title={c.name}
                  className={`w-6 h-6 sm:w-6 sm:h-6 rounded-full border transition-all duration-200 relative ${
                    isSelected
                      ? 'ring-1 ring-offset-2 ring-gray-900 scale-110 shadow-sm'
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: c.hex,
                    boxShadow: c.hex.toLowerCase() === '#ffffff' ? 'inset 0 0 0 1px #d1d5db' : undefined,
                  }}
                />
              )
            })}
          </div>
        </div>
      ) : product.sizeChart?.imageUrl ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowSizeChart(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-[#FF007A] transition-colors cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5 text-[#FF007A]" />
            <span>Size Guide</span>
          </button>
        </div>
      ) : null}

      {/* 7. Size Selection */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <span className="text-gray-500 font-medium">Size :</span>
          <span className="text-gray-950 font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 border border-gray-200/90 shadow-2xs">
            {selectedSize}
          </span>
        </div>

        {/* Size Pills: Only pure size S, M, L, XL with increased comfortable height */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {availableSizes.map((size) => {
            const isSelected = selectedSize.toUpperCase() === size.toUpperCase()
            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`min-w-[40px] sm:min-w-[45px] h-9 sm:h-10 px-3.5 sm:px-4 rounded-[5px] text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'border border-[#FF007A] text-[#FF007A] bg-[#FFF0F6]/90 shadow-sm scale-[1.03]'
                    : 'border border-gray-200 text-gray-700 hover:border-gray-400 bg-white hover:text-black hover:bg-gray-50/50'
                }`}
              >
                {size}
              </button>
            )
          })}
        </div>
      </div>

      {/* 8 & 9. Quantity & Action Buttons & Wishlist: 1 row on Desktop, 2 rows on Mobile */}
      <div className="py-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
          {/* Mobile Row 1: Quantity + Wishlist (Desktop: Left side of 1 row) */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
            <div className="flex-1 md:flex-initial flex items-center w-full md:w-auto">
              <div className="flex w-full md:inline-flex md:w-auto items-center justify-between border border-gray-200 rounded-[5px] bg-white overflow-hidden shadow-sm h-11">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 sm:px-3 h-full hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isOutOfStock || quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="flex-1 md:flex-none md:w-9 text-center font-bold text-sm text-gray-900">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={isOutOfStock || (currentStock > 0 && quantity >= currentStock)}
                  className="px-4 sm:px-3 h-full hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Wishlist Button on Mobile */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label="Wishlist"
              className={`md:hidden h-11 w-11 rounded-[5px] border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isWishlisted
                  ? 'border-[#FF007A] bg-[#FFF0F6] text-[#FF007A]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#FF007A]' : ''}`} />
            </button>
          </div>

          {/* Action Buttons: Mobile Row 2 (grid-cols-2), Desktop inline in 1 row */}
          <div className="flex-1 grid grid-cols-2 md:flex md:items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`flex-1 h-11 px-4 rounded-[5px] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all duration-300 active:scale-[0.98] whitespace-nowrap select-none overflow-hidden relative ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed shadow-none'
                  : isAddedSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25 scale-[1.02] cursor-pointer'
                  : 'bg-[#FF007A] hover:bg-[#E0006C] text-white shadow-[#FF007A]/20 cursor-pointer'
              }`}
            >
              {isOutOfStock ? (
                <span>Out of Stock</span>
              ) : isAddedSuccess ? (
                <span className="flex items-center gap-1.5 animate-island-enter">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ADDED TO BAG!</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span>Add to Cart</span>
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`flex-1 h-11 px-4 rounded-[5px] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                isOutOfStock
                  ? 'border border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed shadow-none'
                  : 'border-2 border-gray-500 bg-white hover:bg-gray-900 text-gray-900 hover:text-white cursor-pointer'
              }`}
            >
              <Zap className="w-4 h-4 fill-current shrink-0" />
              <span>Buy Now</span>
            </button>

            {/* Wishlist Button on Desktop */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label="Wishlist"
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`hidden md:flex h-11 w-11 rounded-[5px] border transition-all items-center justify-center shrink-0 hover:scale-105 active:scale-95 cursor-pointer ${
                isWishlisted
                  ? 'border-[#FF007A] bg-[#FFF0F6] text-[#FF007A]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-[#FF007A]'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#FF007A]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Size Chart Popup */}
      {product.sizeChart?.imageUrl && (
        <SizeChartPopup
          isOpen={showSizeChart}
          onClose={() => setShowSizeChart(false)}
          imageUrl={product.sizeChart.imageUrl}
          title={product.sizeChart.title || 'TeenZos Size Chart'}
        />
      )}
    </div>
  )
}
