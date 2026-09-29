'use client'

import React from 'react'

type PageLoaderProps = {
  text?: string
  fullScreen?: boolean
}

export default function PageLoader({ text = 'Loading...', fullScreen = false }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center select-none ${
        fullScreen
          ? 'fixed inset-0 h-screen h-[100dvh] z-[80] bg-white/85 backdrop-blur-[6px] transition-all duration-300 pointer-events-auto'
          : 'w-full flex flex-col items-center justify-center'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Outer Orbit Wrapper + Small Orbiting Circle */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
          {/* 1. Outer Orbit Dashed Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#36B8C5]/70 animate-spin-orbit" />

          {/* 2. Small Orbiting Circle on outside ring */}
          <div className="absolute inset-0 animate-spin-orbit pointer-events-none">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#36B8C5] shadow-[0_0_12px_#36B8C5] border-2 border-white ring-1 ring-[#36B8C5]/40" />
          </div>

          {/* 3. Subtle Counter Orbit Accent Ring */}
          <div className="absolute inset-1.5 rounded-full border border-dotted border-[#F72585]/35 animate-spin-reverse pointer-events-none" />

          {/* 4. Inner Main Circle (White Background, NOT black) */}
          <div className="relative w-[88px] h-[88px] sm:w-[98px] sm:h-[98px] rounded-full bg-white border-2 border-[#F72585] shadow-[0_6px_22px_rgba(247,37,133,0.22),0_2px_10px_rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden animate-pulse-brand px-2">
            {/* Ambient soft glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F72585]/10 via-[#36B8C5]/10 to-transparent rounded-full pointer-events-none" />

            {/* Teen - Zos Text Strictly Single Line */}
            <span
              className="font-display font-[300] uppercase tracking-wider text-[#0B0D0E] text-[15px] sm:text-[16.5px] z-10 text-center leading-none select-none whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Teen <span className="text-[#F72585]">-</span> Zos
            </span>
          </div>
        </div>

        {/* 5. Loading... Text Outside and Below Circle (With Increased Padding & Spacing) */}
        <div className="mt-6 sm:mt-7 pt-1 px-4 py-1.5 flex items-center gap-1.5 text-center">
          <span className="font-body font-bold text-xs sm:text-sm tracking-[0.09em] uppercase text-[#0B0D0E]/85">
            {text}
          </span>
          <span className="inline-flex gap-1 items-center ml-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F72585] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#36B8C5] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B0D0E] animate-bounce" />
          </span>
        </div>
      </div>
    </div>
  )
}
