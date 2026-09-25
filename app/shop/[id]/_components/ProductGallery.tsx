'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { productLoaderFor } from '@/lib/cloudinaryImage'

type ProductGalleryProps = {
  images: string[]
  productName: string
  badge?: string
  selectedIndex?: number
  onSelectIndex?: (index: number) => void
}

type Point = {
  x: number
  y: number
}

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const target = event.currentTarget
  const src = target.src || ''
  if (/_w(400|800|1200|1600)\.webp/.test(src)) {
    const fallbackSrc = src.replace(/_w(400|800|1200|1600)\.webp/, '')
    if (fallbackSrc !== src) {
      target.src = fallbackSrc
      return
    }
  }
  target.onerror = null
  target.src = '/image.png'
}

export default function ProductGallery({
  images,
  productName,
  badge,
  selectedIndex,
  onSelectIndex,
}: ProductGalleryProps) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0)
  const activeIndex = selectedIndex !== undefined ? selectedIndex : internalActiveIndex

  const setActiveIndex = (nextIndex: number | ((prev: number) => number)) => {
    const resolved = typeof nextIndex === 'function' ? nextIndex(activeIndex) : nextIndex
    setInternalActiveIndex(resolved)
    if (onSelectIndex) {
      onSelectIndex(resolved)
    }
  }

  const [dragOffset, setDragOffset] = useState(0)
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: 'center',
    transform: 'scale(1)',
  })
  const [isZooming, setIsZooming] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxZoom, setLightboxZoom] = useState(1)
  const [lightboxPan, setLightboxPan] = useState<Point>({ x: 0, y: 0 })
  const pointerStartX = useRef<number | null>(null)
  const pointerDeltaX = useRef(0)
  const didDrag = useRef(false)
  const lightboxPointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartDistance = useRef<number | null>(null)
  const pinchStartZoom = useRef(1)
  const pinchStartPan = useRef<Point>({ x: 0, y: 0 })
  const pinchStartFocal = useRef<Point | null>(null)
  const singlePointerStart = useRef<Point | null>(null)
  const singlePointerStartPan = useRef<Point>({ x: 0, y: 0 })
  const didLightboxMove = useRef(false)
  const lastTapAt = useRef(0)

  // Ensure we have at least one image to display
  const displayImages = images.length > 0 ? images : ['/image.png']
  const hasMultipleImages = displayImages.length > 1

  useEffect(() => {
    if (selectedIndex === undefined) {
      setInternalActiveIndex(0)
    }
    setDragOffset(0)
    setIsZooming(false)
    setIsLightboxOpen(false)
    setLightboxZoom(1)
    setLightboxPan({ x: 0, y: 0 })
  }, [images, selectedIndex])

  useEffect(() => {
    if (!isLightboxOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false)
      } else if (event.key === 'ArrowLeft') {
        showPrevious()
      } else if (event.key === 'ArrowRight') {
        showNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLightboxOpen, displayImages.length])

  const showPrevious = () => {
    setActiveIndex((index) => (index === 0 ? displayImages.length - 1 : index - 1))
  }

  const showNext = () => {
    setActiveIndex((index) => (index === displayImages.length - 1 ? 0 : index + 1))
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerStartX.current = event.clientX
    pointerDeltaX.current = 0
    didDrag.current = false
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return
    const deltaX = event.clientX - pointerStartX.current
    pointerDeltaX.current = deltaX
    if (Math.abs(deltaX) > 6) {
      didDrag.current = true
    }
    if (hasMultipleImages) {
      setDragOffset(deltaX)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.releasePointerCapture && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (pointerStartX.current === null) return
    const swipeThreshold = Math.min(80, event.currentTarget.clientWidth * 0.16)
    const deltaX = pointerDeltaX.current

    if (deltaX > swipeThreshold) {
      showPrevious()
    } else if (deltaX < -swipeThreshold) {
      showNext()
    }

    pointerStartX.current = null
    pointerDeltaX.current = 0
    setDragOffset(0)
  }

  const handlePointerCancel = () => {
    pointerStartX.current = null
    pointerDeltaX.current = 0
    setDragOffset(0)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((event.clientX - left) / width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - top) / height) * 100))

    setIsZooming(true)
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.45)',
    })
  }

  const handleMouseLeave = () => {
    setIsZooming(false)
    setZoomStyle({
      transformOrigin: 'center',
      transform: 'scale(1)',
    })
  }

  const openMobileLightbox = () => {
    if (didDrag.current) return
    setIsLightboxOpen(true)
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 lg:gap-4 items-start w-full">
      {/* Thumbnails (Vertical on desktop, Horizontal on mobile) */}
      {displayImages.length > 1 && (
        <div className="order-2 md:order-1 flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto p-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full md:w-[78px] lg:w-[86px] md:max-h-[500px] lg:max-h-[520px] shrink-0">
          {displayImages.map((img, index) => {
            const isActive = activeIndex === index
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Select image ${index + 1}`}
                className={`relative w-18 h-18 sm:w-20 sm:h-20 md:w-full md:h-[84px] lg:h-[86px] shrink-0 rounded-[5px] overflow-hidden transition-all duration-200 bg-white cursor-pointer ${
                  isActive
                    ? 'ring-2 ring-[#FF007A] ring-offset-2 ring-offset-white shadow-sm opacity-100 scale-[1.02]'
                    : 'border border-gray-200/90 hover:border-gray-400 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  loader={productLoaderFor(img)}
                  sizes="92px"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onError={handleImageError}
                  className="h-full w-full object-cover object-center"
                />
                {/* Active Border Overlay on top of image to guarantee 100% visibility */}
                {isActive && (
                  <div className="absolute inset-0 rounded-[5px] border-2 border-[#FF007A] pointer-events-none z-10" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Main Image Showcase Card (Reduced height on desktop) */}
      <div className="order-1 md:order-2 relative w-full flex-1 aspect-[1/1] sm:aspect-[4/4.3] md:aspect-[4/3.8] lg:aspect-[4/5.4] md:max-h-[480px] lg:max-h-[500px] rounded-[5px]  overflow-hidden bg-white border border-gray-200/80 shadow-sm select-none group flex items-center justify-center">
        {/* Neon Graffiti Splatter & Spray Art Backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Subtle concrete texture overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Electric Pink spray burst on left */}
          <div className="absolute -left-12 top-1/4 w-60 h-60 rounded-full bg-[#FF007A]/15 blur-3xl" />
          <svg
            className="absolute -left-4 top-16 w-32 h-32 text-[#FF007A] opacity-25"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 15 Q65 30 75 18 Q85 45 68 55 Q90 70 70 85 Q50 75 35 90 Q20 70 30 50 Q10 40 25 25 Q35 35 50 15 Z" />
            <circle cx="85" cy="30" r="4" />
            <circle cx="20" cy="75" r="3" />
            <circle cx="75" cy="85" r="5" />
          </svg>

          {/* Electric Cyan spray burst on right */}
          <div className="absolute -right-12 top-1/3 w-60 h-60 rounded-full bg-[#00F0FF]/15 blur-3xl" />
          <svg
            className="absolute -right-4 top-24 w-32 h-32 text-[#00C2FF] opacity-25"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M45 10 Q70 20 60 45 Q85 55 65 75 Q75 95 45 80 Q25 90 30 65 Q10 60 20 35 Q30 40 45 10 Z" />
            <circle cx="15" cy="20" r="3.5" />
            <circle cx="82" cy="70" r="4.5" />
          </svg>
        </div>


        {/* Image Slider Track */}
        <div
          className="relative w-full h-full cursor-zoom-in z-[1]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClick={openMobileLightbox}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`flex h-full will-change-transform ${
              dragOffset === 0 ? 'transition-transform duration-300 ease-out' : ''
            }`}
            style={{ transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))` }}
          >
            {displayImages.map((img, index) => (
              <div key={`${img}-${index}`} className="relative h-full min-w-full w-full">
                <Image
                  src={img}
                  alt={`${productName} - Image ${index + 1}`}
                  fill
                  loader={productLoaderFor(img)}
                  sizes="(min-width: 1024px) 580px, (min-width: 768px) 50vw, 100vw"
                  priority={index === 0}
                  style={activeIndex === index ? zoomStyle : undefined}
                  loading={index === 0 ? undefined : 'lazy'}
                  onError={handleImageError}
                  className={`w-full h-full object-cover object-center transition-transform ease-out ${
                    isZooming && activeIndex === index ? 'duration-100' : 'duration-300'
                  }`}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Floating Arrow Buttons (< and >) */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                showPrevious()
              }}
              aria-label="Previous image"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-gray-800 flex items-center justify-center shadow-md border border-gray-200/80 transition-all hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                showNext()
              }}
              aria-label="Next image"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-gray-800 flex items-center justify-center shadow-md border border-gray-200/80 transition-all hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
          </>
        )}

        {/* Mobile Pagination Dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm md:hidden">
            {displayImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIndex(index)
                }}
                aria-label={`Jump to image ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === index ? 'w-4 bg-[#FF007A]' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal (for full zoom) */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100000] bg-black/95 flex flex-col justify-between"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span className="text-white text-sm font-semibold">
              {productName} ({activeIndex + 1}/{displayImages.length})
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center p-4">
            <Image
              src={displayImages[activeIndex]}
              alt={productName}
              fill
              loader={productLoaderFor(displayImages[activeIndex])}
              className="object-contain"
              onError={handleImageError}
            />

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-2 py-4 border-t border-white/10 overflow-x-auto px-4">
            {displayImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`relative w-12 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${
                  activeIndex === i ? 'border-[#FF007A]' : 'border-transparent opacity-60'
                }`}
              >
                <Image src={img} alt="Thumb" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
