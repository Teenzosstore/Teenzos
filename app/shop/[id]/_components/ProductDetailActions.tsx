'use client'

import React, { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap, Plus, Minus, Ruler, Truck, ShieldCheck, RotateCcw, Heart } from 'lucide-react'
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
    short_description?: string | null
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

  const handleToggleWishlist = () => {
    setIsWishlisted((prev) => {
      const next = !prev
      if (next) {
        showToast('Saved to your wishlist!', 'success')
      } else {
        showToast('Removed from wishlist', 'info')
      }
      return next
    })
  }

  // Default sizes if none from variants
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL']
  const availableSizes =
    product.variants.length > 0
      ? Array.from(new Set(product.variants.map((v) => v.variant_name)))
      : defaultSizes

  // Set default selected size if current isn't in availableSizes
  React.useEffect(() => {
    if (!availableSizes.includes(selectedSize) && availableSizes.length > 0) {
      setSelectedSize(availableSizes.includes('L') ? 'L' : availableSizes[0])
    }
  }, [availableSizes, selectedSize])

  // Get active variant price
  const activeVariant = product.variants.find((v) => v.variant_name === selectedSize)
  const currentPrice = activeVariant ? activeVariant.price : 1999
  const currentOldPrice = activeVariant?.original_price || 2499
  const discountPercentage = currentOldPrice
    ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
    : 20

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: `${product.name}${selectedColor ? ` (${selectedColor})` : ''}`,
      price: currentPrice,
      image_url: product.image_url,
      category_name: product.category_name,
      variant_id: activeVariant?.id || `${product.id}-${selectedSize.toLowerCase()}`,
      variant_name: `${selectedSize}${selectedColor ? ` / ${selectedColor}` : ''}`,
    })
    showToast(`${quantity} × ${product.name} (${selectedSize}) added to cart!`, 'success')
  }

  const handleBuyNow = () => {
    handleAdd()
    router.push('/checkout')
  }

  return (
    <div className="space-y-3 lg:space-y-3">
      {/* 1. Badge Pill */}
      <div>
        <span className="inline-block bg-[#FFF0F6] text-[#FF007A] text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-[5px] border border-[#FF007A]/15">
          {product.badge || 'NEW ARRIVAL'}
        </span>
      </div>

      {/* 2. Product Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
          {product.name}
        </h1>
      </div>

      {/* 3. Rating & Sold Stats */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex text-[#F59E0B]">
          {'★★★★★'.split('').map((star, i) => (
            <span key={i} className="text-base">
              {star}
            </span>
          ))}
        </div>
        <span className="font-bold text-gray-900">{product.rating || 4.8}</span>
        <span className="text-gray-500">({product.review_count || 128} reviews)</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-700 font-semibold">{product.sold_count || '500+ sold'}</span>
      </div>

      {/* 4. Price Block */}
      <div className="flex items-center gap-3">
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
      </div>

      {/* 5. Short Description / Bio */}
      {product.short_description && (
        <p className="text-gray-600 text-sm sm:text-[15px] leading-relaxed">
          {product.short_description}
        </p>
      )}

      <hr className="border-gray-200/80 my-4" />

      {/* 6. Color Selection Swatches */}
      {product.colors && product.colors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <span>Color:</span>
            <span className="text-gray-900 font-bold">{selectedColor || product.colors[0]?.name}</span>
          </div>

          <div className="flex items-center gap-4">
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
      )}

      {/* 7. Size Selection (Inline on side) & Size Guide */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 pt-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="text-sm font-semibold text-gray-900 shrink-0 mr-1">Size:</span>
          {availableSizes.map((size) => {
            const isSelected = selectedSize === size
            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`min-w-[40px] sm:min-w-[46px] h-9 px-3 rounded-[6px] text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#FF007A] text-[#FF007A] bg-[#FFF0F6]/60 shadow-sm scale-[1.02]'
                    : 'border border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                }`}
              >
                {size}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowSizeChart(true)}
          className="inline-flex items-center gap-1 text-xs font-bold text-gray-800 hover:text-[#FF007A] transition-colors ml-auto sm:ml-0"
        >
          <Ruler className="w-3.5 h-3.5 text-[#FF007A]" />
          Size Guide
        </button>
      </div>

      {/* 8 & 9. Quantity & Action Buttons & Wishlist: 1 row on Desktop, 2 rows on Mobile */}
      <div className="py-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
          {/* Mobile Row 1: Quantity + Wishlist (Desktop: Left side of 1 row) */}
          <div className="flex items-center justify-between md:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-gray-900 md:hidden">Quantity:</span>
              <div className="inline-flex items-center border border-gray-200 rounded-[5px] bg-white overflow-hidden shadow-sm h-11">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 h-full hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center font-bold text-sm text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 h-full hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
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
              className="flex-1 h-11 px-4 rounded-[5px] bg-[#FF007A] hover:bg-[#E0006C] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-[#FF007A]/20 transition-all duration-200 active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>Add to Cart</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 h-11 px-4 rounded-[5px] border-2 border-gray-500 bg-white hover:bg-gray-900 text-gray-900 hover:text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] whitespace-nowrap cursor-pointer"
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
      <SizeChartPopup
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        imageUrl={product.sizeChart?.imageUrl || '/Default_SizeChart.jpg'}
        title={product.sizeChart?.title || 'TeenZos Size Chart'}
      />
    </div>
  )
}
