'use client'

import React, { useState, useMemo } from 'react'
import ProductBreadcrumbBar from './ProductBreadcrumbBar'
import ProductGallery from './ProductGallery'
import ProductDetailActions, { ProductVariant } from './ProductDetailActions'
import ProductTabsSection from './ProductTabsSection'

type ProductImage = {
  image_url: string
  color_name?: string | null
}

type ProductViewSectionProps = {
  product: {
    id: string
    name: string
    badge: string | null
    rating: number | null
    review_count?: number
    sold_count?: string
    short_description: string | null
    description?: string | null
    features?: string[]
    specifications?: { label: string; value: string }[]
    colors: { name: string; hex: string }[]
  }
  images: ProductImage[]
  variants: ProductVariant[]
  information?: { label: string; value: string }[]
  categoryName: string
  categoryId?: string
  sizeChart?: {
    imageUrl: string
    title: string
  } | null
  reviews?: any[]
  currentUser?: { id: string; name?: string } | null
}

export default function ProductViewSection({
  product,
  images,
  variants,
  information = [],
  categoryName,
  categoryId = 'hoodies',
  sizeChart = null,
  reviews = [],
  currentUser = null,
}: ProductViewSectionProps) {
  const uniqueColors = product.colors || []

  const [selectedColor, setSelectedColor] = useState<string | null>(
    uniqueColors.length > 0 ? uniqueColors[0].name : 'Black'
  )

  const [galleryIndex, setGalleryIndex] = useState(0)

  // Clean flat list of image URLs
  const allImageUrls = useMemo(() => {
    if (images && images.length > 0) {
      return images.map((img) => img.image_url)
    }
    return ['/image.png']
  }, [images])

  // Handle color change and try to match with an image
  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName)

    const normalizedColor = colorName.toLowerCase().trim()
    const colorMatchIdx = images.findIndex(
      (img) => img.color_name?.toLowerCase().trim() === normalizedColor
    )

    if (colorMatchIdx !== -1) {
      setGalleryIndex(colorMatchIdx)
    } else {
      // For default sample colors: Black -> 0, White -> 1, Pink -> 2, etc.
      const colorIdx = uniqueColors.findIndex(
        (c) => c.name.toLowerCase().trim() === normalizedColor
      )
      if (colorIdx !== -1 && colorIdx < allImageUrls.length) {
        setGalleryIndex(colorIdx)
      }
    }
  }

  // Combine information into specifications if not provided
  const combinedSpecs = useMemo(() => {
    if (product.specifications && product.specifications.length > 0) {
      return product.specifications
    }
    if (information && information.length > 0) {
      return information
    }
    return [
      { label: 'Fabric Details', value: '380 GSM Heavyweight Cotton Fleece' },
      { label: 'Fit Profile', value: 'Oversized Streetwear Silhouette' },
      { label: 'Stitching Details', value: 'Double-Needle Reinforced Seams' },
      { label: 'Care Instructions', value: 'Machine wash cold inside out, tumble dry low' },
      { label: 'Country of Origin', value: 'Crafted with Pride in India' },
    ]
  }, [product.specifications, information])

  return (
    <div className="w-full">
      {/* 1. Breadcrumbs & Social Share Row */}
      <ProductBreadcrumbBar
        categoryName={categoryName}
        categoryId={categoryId}
        productName={product.name}
      />

      {/* 2. Main Product Showcase (Left: Gallery, Right: Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Vertical Gallery & Showcase */}
        <div className="lg:col-span-6 w-full">
          <ProductGallery
            images={allImageUrls}
            productName={product.name}
            badge={product.badge || undefined}
            selectedIndex={galleryIndex}
            onSelectIndex={(newIdx) => setGalleryIndex(newIdx)}
          />
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="lg:col-span-6 w-full">
          <ProductDetailActions
            product={{
              id: product.id,
              name: product.name,
              badge: product.badge,
              rating: product.rating,
              review_count: product.review_count,
              sold_count: product.sold_count,
              short_description: product.short_description,
              image_url: allImageUrls[0],
              category_name: categoryName,
              colors: uniqueColors,
              variants: variants,
              sizeChart: sizeChart,
            }}
            selectedColor={selectedColor}
            onColorChange={handleColorChange}
          />
        </div>
      </div>

      {/* 3. Tabbed Content Card (Description, Specifications, Size & Fit, Shipping & Returns, Reviews) */}
      <ProductTabsSection
        productId={product.id}
        productName={product.name}
        description={product.description || undefined}
        features={product.features}
        specifications={combinedSpecs}
        reviews={reviews}
        sizeChart={sizeChart}
        currentUser={currentUser}
      />
    </div>
  )
}
