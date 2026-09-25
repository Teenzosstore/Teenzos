'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'

export type RelatedProduct = {
  id: string
  slug?: string
  name: string
  price: number
  oldPrice?: number
  discount?: string
  image_url: string
  rating?: number
  review_count?: number
  category_id?: string
}

const DEFAULT_RELATED_PRODUCTS: RelatedProduct[] = [
  {
    id: 'street-bunny-hoodie',
    slug: 'street-bunny-hoodie',
    name: 'Street Bunny Hoodie',
    price: 1999,
    oldPrice: 2499,
    discount: '20% OFF',
    image_url: '/images/products/street-bunny-hoodie.jpg',
    rating: 5.0,
    review_count: 96,
  },
  {
    id: 'urban-bunny-hoodie',
    slug: 'urban-bunny-hoodie',
    name: 'Urban Bunny Hoodie',
    price: 1999,
    oldPrice: 2499,
    discount: '20% OFF',
    image_url: '/images/products/urban-bunny-hoodie.jpg',
    rating: 5.0,
    review_count: 104,
  },
  {
    id: 'signature-hoodie',
    slug: 'signature-hoodie',
    name: 'Signature Hoodie',
    price: 1799,
    oldPrice: 2299,
    discount: '22% OFF',
    image_url: '/images/products/signature-sweatshirt.jpg',
    rating: 5.0,
    review_count: 120,
  },
  {
    id: 'paint-drip-hoodie',
    slug: 'paint-drip-hoodie',
    name: 'Paint Drip Hoodie',
    price: 1999,
    oldPrice: 2499,
    discount: '20% OFF',
    image_url: '/images/products/paint-drip-hoodie.jpg',
    rating: 5.0,
    review_count: 88,
  },
  {
    id: 'graffiti-print-tee',
    slug: 'graffiti-print-tee',
    name: 'Graffiti Print Tee',
    price: 799,
    oldPrice: 999,
    discount: '20% OFF',
    image_url: '/images/trending_now/trending_now3.jpeg',
    rating: 5.0,
    review_count: 210,
  },
  {
    id: 'cargo-joggers',
    slug: 'cargo-joggers',
    name: 'Cargo Joggers',
    price: 1299,
    oldPrice: 1799,
    discount: '20% OFF',
    image_url: '/images/products/cargo-joggers.jpg',
    rating: 5.0,
    review_count: 72,
  },
]

export default function YouMayAlsoLikeSection({
  products = [],
  currentProductId,
}: {
  products?: RelatedProduct[]
  currentProductId?: string
}) {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({})

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlist((prev) => {
      const next = !prev[id]
      if (next) {
        showToast('Saved to wishlist!', 'success')
      } else {
        showToast('Removed from wishlist', 'info')
      }
      return { ...prev, [id]: next }
    })
  }

  const handleQuickAdd = (p: RelatedProduct, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url,
      variant_name: 'Standard',
    })
    showToast(`Added ${p.name} to cart!`, 'success')
  }

  // Filter out current product, or use mockup defaults
  const displayItems =
    products.length >= 4
      ? products.filter((p) => p.id !== currentProductId).slice(0, 6)
      : DEFAULT_RELATED_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, 6)

  return (
    <section className="mt-14 md:mt-20 pt-8 border-t border-gray-200/80">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            You May Also Like
          </h2>

        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#FF007A] hover:text-[#E0006C] transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 6 Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4">
        {displayItems.map((p) => {
          const isFavorited = !!wishlist[p.id]
          const oldPrice = p.oldPrice || Math.round(p.price * 1.25)
          const discount =
            p.discount || `${Math.round(((oldPrice - p.price) / oldPrice) * 100)}% OFF`

          return (
            <Link
              key={p.id}
              href={`/shop/${p.slug || p.id}`}
              className="group bg-white rounded-[5px] border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 p-2.5 sm:p-3 flex flex-col justify-between"
            >
              {/* Image & Wishlist Container */}
              <div className="relative aspect-[3/3.2] w-full rounded-[5px] overflow-hidden bg-gray-50 flex items-center justify-center mb-3">
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
                />

                {/* Wishlist Heart Icon (Top Right) */}
                <button
                  type="button"
                  onClick={(e) => toggleWishlist(p.id, e)}
                  aria-label="Wishlist"
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95"
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors ${
                      isFavorited ? 'fill-[#FF007A] text-[#FF007A]' : 'text-gray-600'
                    }`}
                  />
                </button>
              </div>

              {/* Product Info */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#FF007A] transition-colors truncate">
                    {p.name}
                  </h3>

                  {/* Price & Discount */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="font-extrabold text-xs sm:text-sm text-gray-900">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    {oldPrice && (
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                        ₹{oldPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="bg-[#FFF0F6] text-[#FF007A] text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded">
                      {discount}
                    </span>
                  </div>
                </div>

                {/* Rating & Quick Cart Button Row */}
                <div className="flex items-center justify-between pt-1.5">
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <span className="text-[#F59E0B] text-xs">★</span>
                    <span className="text-gray-500 font-medium">({p.review_count || 96})</span>
                  </div>

                  {/* Quick Add-to-Cart Black Square Button */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(p, e)}
                    aria-label={`Add ${p.name} to cart`}
                    title="Add to cart"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-[5px] bg-gray-900 hover:bg-[#FF007A] text-white flex items-center justify-center transition-colors shadow-sm active:scale-90"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
