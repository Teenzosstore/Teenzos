'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Loader2, Maximize2, Minimize2, Move } from 'lucide-react'

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
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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
  }, [isOpen, onClose, isZoomed])

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
    setIsZoomed(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isZoomed) return
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.min(Math.max(zoomLevel + delta, 1), 5)
    setZoomLevel(newZoom)
    
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 })
      setIsZoomed(false)
    } else {
      setIsZoomed(true)
    }
  }, [zoomLevel, isZoomed])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isZoomed || zoomLevel <= 1) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y })
    e.preventDefault()
  }, [isZoomed, zoomLevel, panPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPanPosition({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    })
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isZoomed || zoomLevel <= 1) return
    const touch = e.touches[0]
    setIsPanning(true)
    setPanStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y })
  }, [isZoomed, zoomLevel, panPosition])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPanning) return
    const touch = e.touches[0]
    setPanPosition({
      x: touch.clientX - panStart.x,
      y: touch.clientY - panStart.y
    })
    e.preventDefault()
  }, [isPanning, panStart])

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleDoubleClick = useCallback(() => {
    if (isZoomed) {
      resetZoom()
    } else {
      setIsZoomed(true)
      setZoomLevel(2)
    }
  }, [isZoomed, resetZoom])

  const toggleZoom = useCallback(() => {
    if (isZoomed) {
      resetZoom()
    } else {
      setIsZoomed(true)
      setZoomLevel(2)
    }
  }, [isZoomed, resetZoom])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        ref={containerRef}
        className={`relative max-w-xl max-h-[80vh] overflow-hidden transition-all duration-300 rounded-3xl ${
          isZoomed ? 'fixed inset-0 max-w-full max-h-full z-[60] rounded-3xl' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Content - with zoom/pan controls */}
        <div className="relative w-full h-[70vh] flex items-center justify-center bg-transparent rounded-3xl">
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
            <>
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
                height={1600}
                className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-300 cursor-${isZoomed && zoomLevel > 1 ? 'grab' : 'default'} ${isPanning ? 'cursor-grabbing' : ''} ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  transition: isPanning || isZoomed ? 'none' : 'transform 0.2s ease-out, opacity 0.3s ease-out',
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageLoaded(true)
                  setImageError(true)
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
                priority
              />
            </>
          )}

          {/* Top controls - Expand/Zoom on LEFT, Close on RIGHT */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <button
                onClick={toggleZoom}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm shadow-lg"
                aria-label={isZoomed ? 'Reset zoom' : 'Zoom in'}
                title={isZoomed ? 'Click to reset zoom (or double-click image)' : 'Click to zoom (scroll to zoom, drag to pan)'}
              >
                {isZoomed ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
            <div className="pointer-events-auto">
              <button
                onClick={onClose}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm shadow-lg"
                aria-label="Close size chart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Zoom indicator */}
          {isZoomed && zoomLevel > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
                {Math.round(zoomLevel * 100)}% • Drag to pan • Scroll to zoom
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}