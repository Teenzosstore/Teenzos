'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Loader2, Maximize2, Minimize2 } from 'lucide-react'

interface SizeChartPopupProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title?: string
}

export default function SizeChartPopup({ isOpen, onClose, imageUrl, title = 'Size Chart' }: SizeChartPopupProps) {
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      resetZoom()
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, resetZoom])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isZoomed) {
          resetZoom()
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, isZoomed, resetZoom])

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

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isZoomed || zoomLevel <= 1) return
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsPanning(true)
      setPanStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y })
    }
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
    e.preventDefault()
  }, [isPanning, panStart, zoomLevel, imageBox])

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

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

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm select-none" 
      onClick={onClose}
      onDragStart={(e) => e.preventDefault()}
    >
      <div 
        ref={containerRef}
        className={`relative w-auto max-w-[92vw] sm:max-w-[480px] md:max-w-[500px] overflow-hidden transition-all duration-300 rounded-[5px] flex items-center justify-center select-none ${
          isZoomed ? 'fixed inset-0 max-w-full max-h-full z-[60] rounded-none' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Image Content - with zoom/pan controls */}
        <div className={`relative w-full ${isZoomed ? 'h-full' : 'max-h-[52vh] sm:max-h-[58vh]'} flex items-center justify-center bg-transparent rounded-[5px]`}>
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
              onDragStart={(e) => e.preventDefault()}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              <Image
                ref={imageRef}
                src={imageUrl}
                alt={title}
                width={1200}
                height={800}
                unoptimized={imageUrl?.startsWith('http')}
                draggable={false}
                onDragStart={(e) => {
                  e.preventDefault()
                  return false
                }}
                className={`max-w-full max-h-[50vh] sm:max-h-[56vh] w-auto h-auto object-contain rounded-[5px] select-none ${
                  isZoomed && zoomLevel > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.2s ease-out, opacity 0.3s ease-out',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: isZoomed && zoomLevel > 1 ? 'none' : 'auto',
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
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
    </div>
  )
}