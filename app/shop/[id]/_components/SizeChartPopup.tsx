'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, Loader2, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react'

interface SizeChartPopupProps {
  isOpen: boolean
  onClose: () => void
  imageUrls: string[]
  title?: string
}

export default function SizeChartPopup({ isOpen, onClose, imageUrls, title = 'Size Chart' }: SizeChartPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [imageBox, setImageBox] = useState<{ width: number; height: number } | null>(null)

  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const hasMultiple = imageUrls.length > 1
  const imageUrl = imageUrls[currentIndex] || imageUrls[0]

  const updateSize = useCallback(() => {
    const img = imageRef.current
    if (!img || img.clientWidth <= 0) return
    setImageBox((prev) => {
      if (prev && Math.abs(prev.width - img.clientWidth) < 1 && Math.abs(prev.height - img.clientHeight) < 1) {
        return prev
      }
      return { width: img.clientWidth, height: img.clientHeight }
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updateSize()

    const img = imageRef.current
    if (!img) return

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateSize()
      })
      ro.observe(img)
    }

    window.addEventListener('resize', updateSize)
    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [isOpen, updateSize, imageLoaded])

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
    setIsZoomed(false)
    setIsPanning(false)
  }, [])

  // Reset to the first image and clear zoom state whenever the popup (re)opens.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setCurrentIndex(0)
    } else {
      resetZoom()
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, resetZoom])

  // Switching images: reset zoom/pan and loading state for the new image.
  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= imageUrls.length) return
      resetZoom()
      setImageLoaded(false)
      setImageError(false)
      setCurrentIndex(index)
    },
    [imageUrls.length, resetZoom]
  )

  const goPrev = useCallback(() => {
    goToIndex((currentIndex - 1 + imageUrls.length) % imageUrls.length)
  }, [currentIndex, imageUrls.length, goToIndex])

  const goNext = useCallback(() => {
    goToIndex((currentIndex + 1) % imageUrls.length)
  }, [currentIndex, imageUrls.length, goToIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        if (isZoomed) {
          resetZoom()
        } else {
          onClose()
        }
      } else if (!isZoomed && hasMultiple) {
        if (e.key === 'ArrowLeft') goPrev()
        if (e.key === 'ArrowRight') goNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, isZoomed, resetZoom, hasMultiple, goPrev, goNext])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isZoomed) return
    e.preventDefault()

    const delta = e.deltaY > 0 ? -0.15 : 0.15
    const newZoom = Math.min(Math.max(zoomLevel + delta, 1), 4)
    setZoomLevel(newZoom)

    if (newZoom <= 1) {
      setPanPosition({ x: 0, y: 0 })
      setIsZoomed(false)
      setIsPanning(false)
    } else {
      setIsZoomed(true)
    }
  }, [zoomLevel, isZoomed])

  // Mouse pan initiation - Always prevent default to block browser native drag ghost
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (!isZoomed || zoomLevel <= 1) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y })
  }, [isZoomed, zoomLevel, panPosition])

  // Global mouse move & up so panning never gets stuck or tears when moving quickly
  useEffect(() => {
    if (!isPanning) return

    const handleWindowMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      const boundX = Math.max(80, ((zoomLevel - 1) * (imageBox?.width || 400)) / 2)
      const boundY = Math.max(80, ((zoomLevel - 1) * (imageBox?.height || 400)) / 2)

      setPanPosition({
        x: Math.max(-boundX, Math.min(boundX, deltaX)),
        y: Math.max(-boundY, Math.min(boundY, deltaY)),
      })
    }

    const handleWindowMouseUp = () => {
      setIsPanning(false)
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [isPanning, panStart, zoomLevel, imageBox])

  // Touch panning while zoomed (React handlers).
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!(isZoomed && zoomLevel > 1) || e.touches.length !== 1) return
    const touch = e.touches[0]
    setIsPanning(true)
    setPanStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y })
  }, [isZoomed, zoomLevel, panPosition])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - panStart.x
    const deltaY = touch.clientY - panStart.y
    const boundX = Math.max(80, ((zoomLevel - 1) * (imageBox?.width || 400)) / 2)
    const boundY = Math.max(80, ((zoomLevel - 1) * (imageBox?.height || 400)) / 2)

    setPanPosition({
      x: Math.max(-boundX, Math.min(boundX, deltaX)),
      y: Math.max(-boundY, Math.min(boundY, deltaY)),
    })
  }, [isPanning, panStart, zoomLevel, imageBox])

  const handleTouchEnd = useCallback(() => {
    if (isPanning) setIsPanning(false)
  }, [isPanning])

  // Swipe between images when not zoomed. Native listeners, not React's: React registers
  // touchmove as passive, so it can't preventDefault a horizontal drag and the browser may
  // claim the gesture. The offset lives in a ref so touchend always sees the final value.
  const touchSwipeStart = useRef<{ x: number; y: number } | null>(null)
  const swipeAxis = useRef<'x' | 'y' | null>(null)
  const swipeOffsetRef = useRef(0)
  const [swipeOffset, setSwipeOffset] = useState(0)

  useEffect(() => {
    const el = wrapperRef.current
    if (!isOpen || !el || !hasMultiple || isZoomed) return

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      touchSwipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      swipeAxis.current = null
    }

    const onMove = (e: TouchEvent) => {
      const start = touchSwipeStart.current
      if (!start || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - start.x
      const dy = e.touches[0].clientY - start.y
      if (!swipeAxis.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        swipeAxis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      if (swipeAxis.current === 'x') {
        e.preventDefault()
        swipeOffsetRef.current = dx
        setSwipeOffset(dx)
      }
    }

    const onEnd = () => {
      if (touchSwipeStart.current && swipeAxis.current === 'x') {
        const threshold = Math.min(60, (el.clientWidth || 300) * 0.18)
        const offset = swipeOffsetRef.current
        if (offset <= -threshold) goNext()
        else if (offset >= threshold) goPrev()
      }
      touchSwipeStart.current = null
      swipeAxis.current = null
      swipeOffsetRef.current = 0
      setSwipeOffset(0)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [isOpen, hasMultiple, isZoomed, imageError, goNext, goPrev])

  const swipeTouchAction = isZoomed && zoomLevel > 1 ? 'none' : 'pan-y'

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (isZoomed) {
      resetZoom()
    } else {
      setIsZoomed(true)
      setZoomLevel(2)
      setPanPosition({ x: 0, y: 0 })
    }
  }, [isZoomed, resetZoom])

  const toggleZoom = useCallback(() => {
    if (isZoomed) {
      resetZoom()
    } else {
      setIsZoomed(true)
      setZoomLevel(2)
      setPanPosition({ x: 0, y: 0 })
    }
  }, [isZoomed, resetZoom])

  if (!isOpen || imageUrls.length === 0 || typeof document === 'undefined') return null

  // Portaled to <body>: the page wrapper is a `relative z-10` stacking context, and the
  // fixed header/announcement bar sit at z-[99999]/z-[100000], so the popup must escape both.
  return createPortal(
    <div
      className="fixed inset-0 z-[100010] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm select-none"
      onClick={onClose}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        ref={containerRef}
        className={`relative w-auto max-w-[94vw] sm:max-w-[640px] md:max-w-[720px] overflow-hidden transition-all duration-300 rounded-[5px] flex items-center justify-center select-none ${
          isZoomed ? 'fixed inset-0 max-w-full max-h-full z-[60] rounded-none' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Image Content - with zoom/pan controls */}
        <div className={`relative w-full ${isZoomed ? 'h-full' : 'max-h-[82vh] sm:max-h-[88vh]'} flex items-center justify-center bg-transparent rounded-[5px]`}>
          {imageError ? (
            <div className="flex flex-col items-center justify-center text-center text-white/80 p-4">
              <p className="font-medium mb-2">Failed to load size chart image</p>
              <button
                onClick={() => {
                  setImageError(false)
                  setImageLoaded(false)
                }}
                className="text-sm text-white hover:underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              ref={wrapperRef}
              className="relative inline-flex items-center justify-center max-w-full max-h-full select-none"
              style={{ touchAction: swipeTouchAction }}
              onDragStart={(e) => e.preventDefault()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              <Image
                key={imageUrl}
                ref={imageRef}
                src={imageUrl}
                alt={hasMultiple ? `${title} (${currentIndex + 1}/${imageUrls.length})` : title}
                width={1200}
                height={800}
                unoptimized={imageUrl?.startsWith('http')}
                draggable={false}
                onDragStart={(e) => {
                  e.preventDefault()
                  return false
                }}
                className={`max-w-full max-h-[80vh] sm:max-h-[86vh] w-auto h-auto object-contain rounded-[5px] select-none ${
                  isZoomed && zoomLevel > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${(panPosition.x + swipeOffset) / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  transition: isPanning || swipeOffset !== 0 ? 'none' : 'transform 0.2s ease-out, opacity 0.3s ease-out',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: swipeTouchAction,
                  WebkitUserDrag: 'none',
                } as React.CSSProperties}
                onLoad={() => {
                  setImageLoaded(true)
                  updateSize()
                  requestAnimationFrame(updateSize)
                }}
                onError={() => {
                  setImageLoaded(true)
                  setImageError(true)
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                priority
              />

              {/* Top controls - Inside image: Expand/Zoom on LEFT, Close on RIGHT */}
              <div
                className={`absolute ${
                  isZoomed ? 'top-4 left-4 right-4 fixed z-50' : 'top-2 sm:top-2.5 left-2 sm:left-2.5 right-2 sm:right-2.5'
                } flex items-start justify-between z-10 pointer-events-none`}
              >
                <div className="pointer-events-auto">
                  <button
                    onClick={toggleZoom}
                    className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/85 text-white rounded-full transition-colors backdrop-blur-sm shadow-md cursor-pointer"
                    aria-label={isZoomed ? 'Reset zoom' : 'Zoom in'}
                    title={isZoomed ? 'Click to reset zoom (or double-click image)' : 'Click to zoom (scroll to zoom, drag to pan)'}
                  >
                    {isZoomed ? <Minimize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
                  </button>
                </div>
                <div className="pointer-events-auto">
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/85 text-white rounded-full transition-colors backdrop-blur-sm shadow-md cursor-pointer"
                    aria-label="Close size chart"
                  >
                    <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                </div>
              </div>

              {/* Prev / Next controls (only when there are multiple images and not zoomed) */}
              {hasMultiple && !isZoomed && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      goPrev()
                    }}
                    className="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 z-10 p-1 sm:p-1.5 bg-black/25 hover:bg-black/55 text-white rounded-full transition-colors shadow-sm cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      goNext()
                    }}
                    className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 z-10 p-1 sm:p-1.5 bg-black/25 hover:bg-black/55 text-white rounded-full transition-colors shadow-sm cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </>
              )}

              {/* Dot indicators (only when there are multiple images and not zoomed) */}
              {hasMultiple && !isZoomed && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-full pointer-events-auto">
                  {imageUrls.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation()
                        goToIndex(idx)
                      }}
                      aria-label={`Go to image ${idx + 1}`}
                      className={`rounded-full transition-all cursor-pointer ${
                        idx === currentIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Zoom indicator */}
              {isZoomed && zoomLevel > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 select-none">
                    {Math.round(zoomLevel * 100)}% • Drag to pan • Scroll to zoom
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
