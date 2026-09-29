'use client'

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import PageLoader from './PageLoader'

const MIN_LOAD_TIME = 1500 // 1.5 seconds

function RouteWatcher({ onComplete }: { onComplete: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    onComplete()
  }, [pathname, searchParams, onComplete])

  return null
}

export default function PageTransitionLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const startTimeRef = useRef<number>(0)
  const isNavigatingRef = useRef(false)
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleRouteComplete = useCallback(() => {
    if (!isNavigatingRef.current) return
    isNavigatingRef.current = false

    const elapsed = Date.now() - startTimeRef.current
    const remainingTime = Math.max(0, MIN_LOAD_TIME - elapsed)

    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
    finishTimeoutRef.current = setTimeout(() => {
      setIsLoading(false)
    }, remainingTime)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (!href) return

      // Ignore external links, new tabs, anchors, tel/mailto, modifiers
      if (
        target.target === '_blank' ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      // Check if it's an internal link
      try {
        const targetUrl = new URL(target.href, window.location.origin)
        if (targetUrl.origin === window.location.origin) {
          const currentPath = window.location.pathname + window.location.search
          const targetPath = targetUrl.pathname + targetUrl.search

          if (targetPath !== currentPath) {
            if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
            startTimeRef.current = Date.now()
            isNavigatingRef.current = true
            setIsLoading(true)
          }
        }
      } catch {
        // ignore malformed URLs
      }
    }

    // Safety timeout: auto-hide after 5s max so it never gets stuck
    let safetyTimer: NodeJS.Timeout | null = null
    if (isLoading) {
      safetyTimer = setTimeout(() => {
        setIsLoading(false)
        isNavigatingRef.current = false
      }, 5000)
    }

    document.addEventListener('click', handleClick, { capture: true })

    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
      if (safetyTimer) clearTimeout(safetyTimer)
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)
    }
  }, [isLoading])

  return (
    <>
      <Suspense fallback={null}>
        <RouteWatcher onComplete={handleRouteComplete} />
      </Suspense>
      {isLoading && (
        <div className="fixed inset-0 h-screen h-[100dvh] w-screen z-[80] bg-white/90 backdrop-blur-[6px] flex flex-col items-center justify-center overflow-hidden animate-fade-in pointer-events-auto">
          {/* Centered exactly according to 100vh screen viewport */}
          <PageLoader fullScreen={false} text="Loading..." />
        </div>
      )}
    </>
  )
}
