'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import TrendingProductCard from '@/components/TrendingProductCard'
import { ShopProduct } from '@/lib/shopProducts'
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
  category_name?: string
  colors?: { name: string; hex: string }[]
  badge?: string
}

export default function YouMayAlsoLikeSection({
  products = [],
  currentProductId,
  categoryId,
  categoryName,
}: {
  products?: RelatedProduct[] | any[]
  currentProductId?: string
  categoryId?: string
  categoryName?: string
}) {
  const { showToast } = useToast()
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({})
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Listen to wishlist updates globally
  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem('teenzos_wishlist')
        if (saved) setWishlist(JSON.parse(saved))
      } catch {}
    }

    loadWishlist()
    window.addEventListener('teenzos-wishlist-change', loadWishlist)
    window.addEventListener('storage', loadWishlist)
    return () => {
      window.removeEventListener('teenzos-wishlist-change', loadWishlist)
      window.removeEventListener('storage', loadWishlist)
    }
  }, [])

  const toggleWishlist = (id: string) => {
    try {
      let currentMap: Record<string, boolean> = {}
      const saved = localStorage.getItem('teenzos_wishlist')
      if (saved) {
        try {
          currentMap = JSON.parse(saved)
        } catch {}
      }

      const nextVal = !currentMap[id]
      currentMap[id] = nextVal
      localStorage.setItem('teenzos_wishlist', JSON.stringify(currentMap))

      const found = displayItems.find((p) => p.id === id)
      if (found) {
        let cachedProducts: Record<string, any> = {}
        try {
          const raw = localStorage.getItem('teenzos_wishlist_products')
          if (raw) cachedProducts = JSON.parse(raw)
        } catch {}
        if (nextVal) {
          cachedProducts[id] = found
        } else {
          delete cachedProducts[id]
        }
        localStorage.setItem('teenzos_wishlist_products', JSON.stringify(cachedProducts))
      }

      setWishlist({ ...currentMap })

      setTimeout(() => {
        window.dispatchEvent(new Event('teenzos-wishlist-change'))
      }, 0)

      if (nextVal) {
        showToast('Saved to wishlist!', 'success')
      } else {
        showToast('Removed from wishlist', 'info')
      }
    } catch (e) {
      console.error('Wishlist error in YouMayAlsoLike:', e)
    }
  }

  // Resolve category-based similar products (DB first, then shop catalog matching same category)
  const displayItems: ShopProduct[] = useMemo(() => {
    const existingIds = new Set<string>()
    if (currentProductId) existingIds.add(currentProductId)

    const list: ShopProduct[] = []

    // Helper to format a raw product to ShopProduct
    const formatProduct = (p: any): ShopProduct => {
      const price = Number(p.price || 999)
      const oldPrice = Number(p.oldPrice || Math.round(price * 1.25))
      const discount =
        p.discount ||
        (oldPrice > price ? `${Math.round(((oldPrice - price) / oldPrice) * 100)}% OFF` : '20% OFF')

      return {
        id: p.id,
        slug: p.slug || p.id,
        name: p.name,
        category_id: p.category_id || categoryId || 't-shirts',
        category_name: p.category_name || categoryName || 'Streetwear',
        price,
        oldPrice,
        discount,
        image_url: p.image_url || p.featured_image_url || '/image.png',
        badge: p.badge || undefined,
        rating: Number(p.rating) || 0,
        review_count: Number(p.review_count) || 0,
        sizes: p.sizes || ['S', 'M', 'L', 'XL'],
        in_stock: true,
        is_active: true,
        colors: p.colors || [],
        color_name: p.color_name,
        product_images: p.product_images,
        gallery_images: p.gallery_images,
        product_variants: p.product_variants,
        description: p.description,
      }
    }

    // 1. Direct products from DB passed as props that match the current category
    if (Array.isArray(products) && products.length > 0) {
      products.forEach((p: any) => {
        if (!existingIds.has(p.id) && p.is_active !== false) {
          const matchesCat =
            !categoryId ||
            p.category_id === categoryId ||
            (categoryName && p.category_name?.toLowerCase() === categoryName.toLowerCase())

          if (matchesCat) {
            existingIds.add(p.id)
            list.push(formatProduct(p))
          }
        }
      })
    }

    // 2. If still less than 12, include remaining passed products
    if (list.length < 12 && Array.isArray(products)) {
      products.forEach((p: any) => {
        if (!existingIds.has(p.id) && p.is_active !== false) {
          existingIds.add(p.id)
          list.push(formatProduct(p))
        }
      })
    }

    return list.slice(0, 12)
  }, [products, currentProductId, categoryId, categoryName])

  const checkScroll = () => {
    const el = trackRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
  }

  useEffect(() => {
    checkScroll()
    const handleResize = () => checkScroll()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [displayItems.length])

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    if (!card) return
    const cardWidth = card.offsetWidth + 12
    const count = window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3
    el.scrollBy({ left: dir * cardWidth * count, behavior: 'smooth' })
  }

  const viewAllHref = categoryId ? `/shop?category=${categoryId}` : '/shop'

  return (
    <section className="mt-14 md:mt-20 pt-8 border-t border-gray-200/80">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-7">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            You May Also Like
          </h2>
          {categoryName && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-extrabold uppercase text-[#F72585] bg-[#FFE1ED] px-2 py-0.5 rounded-[4px]">
              {categoryName}
            </span>
          )}
        </div>

        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#FF007A] hover:text-[#E0006C] transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Product Cards Slider Container with Left & Right Arrows */}
      <div className="relative group/carousel">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canScrollLeft}
          aria-label="Previous products"
          className="absolute -left-2 sm:-left-3.5 top-[38%] -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-gray-900 shadow-md border border-gray-200/90 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
        </button>

        {/* Scrollable Track: 2 columns on mobile, 3 on sm, 4 on md, 5 on lg */}
        <div
          ref={trackRef}
          onScroll={checkScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full"
        >
          {displayItems.map((p) => (
            <div
              key={p.id}
              data-card
              className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] shrink-0 snap-start flex"
            >
              <div className="w-full flex">
                <TrendingProductCard
                  product={p}
                  isWishlisted={!!wishlist[p.id]}
                  isLiked={!!wishlist[p.id]}
                  onToggleWishlist={toggleWishlist}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canScrollRight}
          aria-label="Next products"
          className="absolute -right-2 sm:-right-3.5 top-[38%] -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-gray-900 shadow-md border border-gray-200/90 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
        </button>
      </div>
    </section>
  )
}
