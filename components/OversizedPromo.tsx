"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

// ==========================================
// SVG DECORATIVE GRAPHICS
// ==========================================

function WhiteCrownSketch({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 54 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 34 L11 10 L22 23 L31 7 L40 24 L49 11 L51 34 Z"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CyanPinkStreaks({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 8 L156 4"
        stroke="#F72585"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M20 22 L150 18"
        stroke="#36B8C5"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ==========================================
// OVERSIZED PROMO / SAME ENERGY BANNER
// ==========================================

export default function OversizedPromo() {
  return (
    <section
      aria-label="Different Fits Same Energy Streetwear Banner"
      className="relative w-full overflow-hidden bg-[#0B0D0E] text-white py-8 sm:py-10 md:py-12 lg:py-16 select-none"
    >
      {/* ── Background Neon City Streetscape ── */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        <Image
          src="/images/same_energy.png"
          alt="TeenZos Neon Streetwear Urban Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-70"
        />
        {/* Subtle Dark Overlays for Optimal Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0E]/30 via-[#0B0D0E]/20 to-[#0B0D0E]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0E]/30 via-transparent to-[#0B0D0E]/20" />
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
          
          {/* =========================================================
              LEFT COLUMN: Headline, Subtitle & Primary CTA Button
              ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left z-10">
            <h2 className="flex flex-col uppercase tracking-tight">
              {/* Line 1: DIFFERENT FITS */}
              <span className="font-display font-[300] text-white text-3xl sm:text-4xl md:text-5xl lg:text-[56px] xl:text-[66px] leading-[0.88] drop-shadow-md">
                DIFFERENT FITS
              </span>

              {/* Line 2: SAME ENERGY. */}
              <span className="font-display font-[300] text-[#36B8C5] text-4xl sm:text-5xl md:text-6xl lg:text-[56px] xl:text-[66px] leading-[0.88] tracking-tight drop-shadow-lg transform -skew-x-6 mt-3 sm:mt-4">
                SAME ENERGY.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-4 sm:mt-5 text-white/90 text-sm sm:text-base md:text-[17px] font-body font-normal leading-relaxed max-w-[420px]">
              Streetwear for the ones who think different.
            </p>

            {/* CTA Button */}
            <div className="mt-6 sm:mt-8">
              <Link
                href="/shop?category=oversized-tees"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#F72585] hover:bg-[#D91668] text-white font-body font-bold text-xs sm:text-sm uppercase tracking-wider px-7 sm:px-8 py-3.5 sm:py-4 rounded-[5px] shadow-lg shadow-[#F72585]/35 hover:shadow-xl hover:shadow-[#F72585]/45 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <span>EXPLORE NOW</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-base leading-none">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* =========================================================
              MIDDLE COLUMN: Tilted Overlapping Photos (NO BORDER)
              ========================================================= */}
          <div className="lg:col-span-5 relative flex items-center justify-center py-4 sm:py-6">
            <div className="relative flex items-center justify-center w-full max-w-[540px]">
              
              {/* Card 1: Left Model Card (se02.jpg - NO BORDER) */}
              <div className="relative w-[170px] h-[210px] sm:w-[220px] sm:h-[260px] md:w-[240px] md:h-[290px] lg:w-[250px] lg:h-[300px] xl:w-[270px] xl:h-[330px] rounded-[10px] border-8 border-white overflow-hidden shadow-2xl shadow-black/80 transform -rotate-[7deg] hover:rotate-0 transition-transform duration-500 ease-out z-10 shrink-0">
                <Image
                  src="/images/se02.jpg"
                  alt="Model wearing Good People Good Outfits street tee"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 45vw, 30vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Card 2: Right Model Card (se01.jpg - NO BORDER) */}
              <div className="relative w-[170px] h-[210px] sm:w-[220px] sm:h-[260px] md:w-[240px] md:h-[290px] lg:w-[250px] lg:h-[300px] xl:w-[270px] xl:h-[330px] rounded-2xl overflow-hidden border-8 border-white shadow-2xl shadow-black/90 transform rotate-[7deg] hover:rotate-0 transition-transform duration-500 ease-out z-20 shrink-0 -ml-12 sm:-ml-16 lg:-ml-16">
                <Image
                  src="/images/se01.jpg"
                  alt="Model wearing TeenZos Cyber Bunny streetwear hoodie"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 45vw, 30vw"
                  className="object-cover object-center"
                />
              </div>

            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: Graffiti Handwritten Text & Accents
              ========================================================= */}
          <div className="lg:col-span-2 relative flex flex-col items-center lg:items-end justify-center text-center lg:text-left z-10">
            {/* Top Crown Sketch */}
            <div className="mb-2 hidden lg:block transform rotate-12">
              <WhiteCrownSketch className="w-10 h-8 text-white opacity-90" />
            </div>

            {/* Handwritten Statement: A BIGGER YOU */}
            <div className="hidden lg:block transform -rotate-6 my-2">
              <p
                className="font-display font-black text-white text-2xl sm:text-3xl lg:text-3xl xl:text-4xl leading-[1.50] tracking-wide uppercase drop-shadow-lg"
              >
                <span className="block text-[#F72585]">A</span>
                <span className="block">BIGGER</span>
                <span className="block">YOU</span>
              </p>
            </div>

            {/* Handwritten Statement for Mobile Only */}
            
            <p
                className="lg:hidden font-display font-[290] text-white text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-[1.50] tracking-[0.20em] uppercase drop-shadow-lg"
              >
                <span className="inline text-[#F72585]">A</span> -  
                <span className="inline">BIGGER</span> -  
                <span className="inline">YOU</span>
              </p>

            {/* Bottom Double Streak Accent */}
            <div className="mt-3 transform -rotate-3">
              <CyanPinkStreaks className="w-28 h-6 sm:w-32 sm:h-7" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
