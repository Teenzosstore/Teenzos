'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useCart, CartItem } from '@/context/CartContext'

// Types for Flying Animation
type FlyingCapsule = {
  id: string
  imageUrl: string
  name: string
  price: number
  variantName?: string
  startX: number
  startY: number
  destX: number
  destY: number
  startTime: number
  duration: number
  // Current interpolated values for 60fps render
  currentX: number
  currentY: number
  scale: number
  opacity: number
  rotation: number
}

type TrailDot = {
  id: string
  x: number
  y: number
  color: string
  createdAt: number
}

type BurstSpark = {
  id: string
  startX: number
  startY: number
  dx: number
  dy: number
  color: string
  createdAt: number
}

// Helper to find the active header cart icon position
export function getCartIconPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 300, y: 30 }

  const targets = document.querySelectorAll<HTMLElement>('[data-cart-target]')
  for (let i = 0; i < targets.length; i++) {
    const el = targets[i]
    const rect = el.getBoundingClientRect()
    // Element must have dimensions and be inside/near the viewport
    if (rect.width > 0 && rect.height > 0 && rect.top >= -50 && rect.bottom <= window.innerHeight + 50) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    }
  }

  // Fallback to top right if cart icon isn't found
  return {
    x: window.innerWidth - 45,
    y: 35,
  }
}

export default function CartFlyOverlay() {
  const { triggerCartBump } = useCart()

  // Flying Capsules & Particle State
  const [capsules, setCapsules] = useState<FlyingCapsule[]>([])
  const [trailDots, setTrailDots] = useState<TrailDot[]>([])
  const [burstSparks, setBurstSparks] = useState<BurstSpark[]>([])

  const capsulesRef = useRef<FlyingCapsule[]>([])
  capsulesRef.current = capsules

  const rafIdRef = useRef<number | null>(null)
  const lastTrailTimeRef = useRef<number>(0)

  // ── Spawn Trailing Spark ──
  const spawnTrailDot = useCallback((x: number, y: number) => {
    const colors = ['#F72585', '#36B8C5', '#FFFFFF']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const newDot: TrailDot = {
      id: `trail-${Date.now()}-${Math.random()}`,
      x: x + (Math.random() * 12 - 6),
      y: y + (Math.random() * 12 - 6),
      color,
      createdAt: Date.now(),
    }
    setTrailDots((prev) => [...prev.slice(-15), newDot])
  }, [])

  // ── Spawn Landing Burst Sparks ──
  const triggerImpactBurst = useCallback((x: number, y: number) => {
    const sparks: BurstSpark[] = []
    const count = 9
    const colors = ['#F72585', '#36B8C5', '#FF85B3', '#65D0D9', '#FFFFFF']

    for (let i = 0; i < count; i++) {
      const angle = (i * (2 * Math.PI)) / count + (Math.random() * 0.4 - 0.2)
      const distance = 26 + Math.random() * 22
      sparks.push({
        id: `spark-${Date.now()}-${i}`,
        startX: x,
        startY: y,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        color: colors[i % colors.length],
        createdAt: Date.now(),
      })
    }

    setBurstSparks((prev) => [...prev.slice(-20), ...sparks])

    // Cleanup sparks after 500ms
    setTimeout(() => {
      setBurstSparks([])
    }, 550)
  }, [])

  // ── Main RAF Animation Loop ──
  const runAnimationLoop = useCallback(() => {
    const now = performance.now()
    const active = capsulesRef.current

    if (active.length === 0) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
      return
    }

    const updated: FlyingCapsule[] = []

    active.forEach((cap) => {
      const elapsed = now - cap.startTime
      const t = Math.min(1, elapsed / cap.duration)

      if (t >= 1) {
        // Landed at destination!
        triggerImpactBurst(cap.destX, cap.destY)
        triggerCartBump()
      } else {
        // Parabolic physics calculation
        const dx = cap.destX - cap.startX
        const dy = cap.destY - cap.startY

        // Magnetic acceleration toward destination at late flight
        const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        const currentX = cap.startX + dx * (t * 0.75 + easeT * 0.25)

        // Arc curve: lifts up high into the air, then swoops down into the cart
        const dist = Math.hypot(dx, dy)
        const arcHeight = Math.min(170, Math.max(75, dist * 0.26))
        const currentY = cap.startY + dy * t - Math.sin(t * Math.PI) * arcHeight

        // Dynamic scale: pops to 1.18, holds, then shrinks to 0.2 at impact
        let scale = 1
        if (t < 0.2) {
          scale = 0.65 + (t / 0.2) * 0.53 // 0.65 -> 1.18
        } else if (t < 0.65) {
          scale = 1.18 - ((t - 0.2) / 0.45) * 0.25 // 1.18 -> 0.93
        } else {
          scale = Math.max(0.08, 0.93 * (1 - (t - 0.65) / 0.35)) // 0.93 -> 0
        }

        // Slight playful rotation in flight
        const rotation = Math.sin(t * Math.PI) * (cap.destX > cap.startX ? 18 : -18)

        // Opacity vanishes only in final 8%
        const opacity = t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1

        // Drop trailing spark every ~50ms
        if (now - lastTrailTimeRef.current > 50) {
          spawnTrailDot(currentX, currentY)
          lastTrailTimeRef.current = now
        }

        updated.push({
          ...cap,
          currentX,
          currentY,
          scale,
          opacity,
          rotation,
        })
      }
    })

    setCapsules(updated)

    // Clean up old trail dots (dots older than 350ms)
    setTrailDots((prev) => prev.filter((d) => Date.now() - d.createdAt < 380))

    if (updated.length > 0) {
      rafIdRef.current = requestAnimationFrame(runAnimationLoop)
    } else {
      rafIdRef.current = null
    }
  }, [spawnTrailDot, triggerCartBump, triggerImpactBurst])

  // ── Listen for custom fly events ──
  useEffect(() => {
    const handleFlyEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        item: Omit<CartItem, 'quantity' | 'cartItemId'>
        startX: number
        startY: number
      }>

      if (!customEvent.detail || !customEvent.detail.item) return

      const { item, startX, startY } = customEvent.detail
      const dest = getCartIconPosition()

      const newCapsule: FlyingCapsule = {
        id: `fly-${Date.now()}-${Math.random()}`,
        imageUrl: item.image_url || '/placeholder.jpg',
        name: item.name || 'Streetwear Item',
        price: item.price || 0,
        variantName: item.variant_name,
        startX: startX || window.innerWidth / 2,
        startY: startY || window.innerHeight * 0.7,
        destX: dest.x,
        destY: dest.y,
        startTime: performance.now(),
        duration: 680,
        currentX: startX,
        currentY: startY,
        scale: 0.65,
        opacity: 1,
        rotation: 0,
      }

      setCapsules((prev) => [...prev, newCapsule])

      // Start loop if not already running
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(runAnimationLoop)
      }
    }

    const handleDirectAddedEvent = () => {
      triggerCartBump()
    }

    window.addEventListener('teenzos-fly-to-cart', handleFlyEvent)
    window.addEventListener('teenzos-item-added-direct', handleDirectAddedEvent)

    return () => {
      window.removeEventListener('teenzos-fly-to-cart', handleFlyEvent)
      window.removeEventListener('teenzos-item-added-direct', handleDirectAddedEvent)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [runAnimationLoop, triggerCartBump])

  return (
    /* ── FLYING CAPSULES LAYER (High Z-Index, Pointer Events None) ── */
    <div
      className="fixed inset-0 pointer-events-none z-[9999999] overflow-hidden"
      aria-hidden="true"
    >
      {/* Trailing Sparkle Particles */}
      {trailDots.map((dot) => (
        <div
          key={dot.id}
          className="absolute rounded-full transition-opacity duration-300"
          style={{
            left: `${dot.x}px`,
            top: `${dot.y}px`,
            width: '6px',
            height: '6px',
            backgroundColor: dot.color,
            boxShadow: `0 0 10px ${dot.color}`,
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, 1 - (Date.now() - dot.createdAt) / 380),
          }}
        />
      ))}

      {/* Impact Radial Burst Sparks */}
      {burstSparks.map((spark) => {
        const age = (Date.now() - spark.createdAt) / 500
        const progressVal = Math.min(1, Math.max(0, age))
        const currentX = spark.startX + spark.dx * progressVal
        const currentY = spark.startY + spark.dy * progressVal
        const sparkOpacity = Math.max(0, 1 - progressVal)

        return (
          <div
            key={spark.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${currentX}px`,
              top: `${currentY}px`,
              width: `${Math.max(2, 6 * (1 - progressVal))}px`,
              height: `${Math.max(2, 6 * (1 - progressVal))}px`,
              backgroundColor: spark.color,
              boxShadow: `0 0 12px ${spark.color}`,
              transform: 'translate(-50%, -50%)',
              opacity: sparkOpacity,
            }}
          />
        )
      })}

      {/* Flying Item Capsules */}
      {capsules.map((cap) => (
        <div
          key={cap.id}
          className="absolute will-change-transform"
          style={{
            left: 0,
            top: 0,
            transform: `translate3d(${cap.currentX}px, ${cap.currentY}px, 0) translate(-50%, -50%) scale(${cap.scale}) rotate(${cap.rotation}deg)`,
            opacity: cap.opacity,
          }}
        >
          {/* Glowing Capsule Aura */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1 bg-[#0B0D0E] border-2 border-[#F72585] shadow-[0_0_24px_rgba(247,37,133,0.7),0_8px_30px_rgba(0,0,0,0.6)] animate-fly-glow flex items-center justify-center">
            {/* Product Thumbnail */}
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
              <Image
                src={cap.imageUrl}
                alt={cap.name}
                fill
                sizes="64px"
                unoptimized
                className="object-cover object-center"
              />
            </div>

            {/* Floating +1 Streetwear Badge */}
            <span className="absolute -top-2 -right-2 bg-[#36B8C5] text-[#0B0D0E] font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-full shadow-md border border-white/60 tracking-wider">
              +1
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
