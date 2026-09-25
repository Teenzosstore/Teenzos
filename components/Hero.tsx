"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useCallback } from "react";

// ==========================================
// TYPES & DATA
// ==========================================

export interface HeroProductItem {
  id: string;
  name: string;
  colorName: string;
  image: string;
  thumbnail: string;
  alt: string;
}

const HERO_PRODUCTS: HeroProductItem[] = [
  {
    id: "hero-prod-1",
    name: "Cyber Bunny Oversized Hoodie - Noir Black",
    colorName: "Black",
    image: "/images/hero/producthero1.png",
    thumbnail: "/images/hero/producthero1.png",
    alt: "TeenZos Black Oversized Streetwear Hoodie with Cyan Bunny Graphic",
  },
  {
    id: "hero-prod-2",
    name: "Cyber Bunny Oversized Hoodie - Raw White",
    colorName: "White",
    image: "/images/hero/producthero3.png",
    thumbnail: "/images/hero/producthero3.png",
    alt: "TeenZos Raw White Streetwear Hoodie with Colorful Bunny Print",
  },
  {
    id: "hero-prod-3",
    name: "Cyber Bunny Oversized Hoodie - Neon Pink",
    colorName: "Pink",
    image: "/images/hero/producthero2.png",
    thumbnail: "/images/hero/producthero2.png",
    alt: "TeenZos Hot Pink Oversized Streetwear Hoodie with Cyan Graphic",
  },
  {
    id: "hero-prod-4",
    name: "Cyber Bunny Oversized Hoodie - Midnight Edition",
    colorName: "Midnight Black",
    image: "/images/hero/producthero1.png",
    thumbnail: "/images/hero/producthero1.png",
    alt: "TeenZos Midnight Cyber Streetwear Hoodie with Graphic Artwork",
  },
];

// ==========================================
// SVG DECORATIVE & ICON COMPONENTS
// ==========================================

function BlackGraffitiCrown({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 32 L11 8 L22 22 L31 5 L40 23 L49 9 L51 32 Z"
        stroke="#0B0D0E"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinkGraffitiCrown({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 32 L11 8 L22 22 L31 5 L40 23 L49 9 L51 32 Z"
        stroke="#F72585"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinkBrushUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 11 C 60 4, 160 3, 336 8 C 260 14, 140 16, 4 11 Z"
        fill="#F72585"
      />
    </svg>
  );
}

function GraffitiCross({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 8 L28 28 M28 8 L8 28"
        stroke="#0B0D0E"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTruck({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconShieldCheck({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconStarOutline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ==========================================
// HERO COMPONENT
// ==========================================

export default function Hero({
  products = HERO_PRODUCTS,
}: {
  products?: HeroProductItem[];
  slides?: any[];
  backgroundImages?: any[];
  leftText?: any;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const activeProduct = products[selectedIndex] || products[0];

  const handleSelectProduct = useCallback(
    (index: number) => {
      if (index === selectedIndex) return;
      setIsFading(true);
      setTimeout(() => {
        setSelectedIndex(index);
        setIsFading(false);
      }, 140);
    },
    [selectedIndex]
  );

  return (
    <section
      id="home"
      aria-label="TeenZos Streetwear Hero Section"
      className="relative w-full overflow-hidden bg-[#F1F1EF] text-[#0B0D0E] select-none"
    >
      {/* ── Preload hidden container for instant switcher switching ── */}
      <div className="hidden" aria-hidden="true">
        {products.map((p) => (
          <Image
            key={p.id}
            src={p.image}
            alt=""
            width={80}
            height={80}
            priority
            unoptimized
          />
        ))}
      </div>

      {/* ── Background Splatter & Concrete Backdrop ── */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        <Image
          src="/images/hero/bg_heros.png"
          alt="TeenZos Urban Grunge and Paint Splatter Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center md:object-right-center lg:object-center"
        />
        {/* Subtle wash for text contrast on mobile */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F1F1EF]/90 via-[#F1F1EF]/40 to-transparent lg:hidden" />
      </div>

      {/* ── Main Content Container with Optimized Compact Height ── */}
      <div className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-[90px] sm:pt-[98px] md:pt-[106px] lg:pt-[94px] pb-6 sm:pb-8 lg:pb-6 min-h-[auto] lg:min-h-[580px] xl:min-h-[640px] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-center w-full my-auto">
          
          {/* =========================================================
              LEFT COLUMN: Brand Copy, CTAs, Trust Indicators (~45%)
              ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center z-10 py-2 sm:py-4">
            {/* Eyebrow */}
            <div className="mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-[12px] font-bold tracking-[0.26em] text-[#0B0D0E] uppercase">
                STREETWEAR
              </span>
            </div>

            {/* Headline */}
            <h1 className="flex flex-col uppercase tracking-tight">
              {/* Line 1: EXPRESS */}
              <span className="font-display font-black text-[#0B0D0E] text-[3.2rem] sm:text-[4.2rem] md:text-[4.8rem] lg:text-[4.4rem] xl:text-[5.2rem] leading-[0.88]">
                  WHAT
                EXPRESS 
              </span>

              {/* Line 3: MOVES YOU + Brush Underline */}
              <div className="relative inline-block mt-1 sm:mt-6">
                <span className="font-display font-black italic tracking-tight text-[#F72585] text-[3rem] sm:text-[4rem] md:text-[4.6rem] lg:text-[4.2rem] xl:text-[5rem] leading-[0.88] block transform -skew-x-6">
                  MOVES YOU
                </span>
                {/* Brush underline stroke */}
                <div className="w-[88%] sm:w-[80%] mt-1 sm:mt-1.5 transform -rotate-1">
                  <PinkBrushUnderline className="w-full h-2 sm:h-3 md:h-3.5 text-[#F72585]" />
                </div>
              </div>
            </h1>

            {/* Supporting Text */}
            <div className="mt-3.5 sm:mt-4 text-[#1A1E20] text-xs sm:text-sm md:text-[15px] font-medium leading-relaxed max-w-[420px]">
              <p>Bold designs. Premium comfort.</p>
              <p>More than clothes, it’s a mindset.</p>
            </div>

            {/* Two CTA Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 mt-5 sm:mt-6">
              {/* Primary Pink Button */}
              <Link
                href="/shop"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F72585] hover:bg-[#D91668] text-white font-semibold text-xs sm:text-sm px-6 sm:px-7 py-3 sm:py-3.5 rounded-[5px] shadow-md shadow-[#F72585]/30 hover:shadow-lg hover:shadow-[#F72585]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <span>Shop Now</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-base leading-none">
                  →
                </span>
              </Link>

              {/* Secondary Outline Button */}
              <Link
                href="/shop"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-black/5 text-[#0B0D0E] font-semibold text-xs sm:text-sm px-5 sm:px-6 py-3 sm:py-3.5 rounded-[5px] border-[1.8px] border-[#0B0D0E]/80 hover:border-[#0B0D0E] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <span>Explore Collections</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-base leading-none">
                  →
                </span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-black/10 grid grid-cols-3 gap-2 sm:gap-3 max-w-[480px]">
              {/* Trust 1: Free Shipping */}
              <div className="flex items-start sm:items-center gap-2">
                <IconTruck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2] mt-0.5 sm:mt-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-[11px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                    Free Shipping
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                    On all orders
                  </span>
                </div>
              </div>

              {/* Trust 2: Premium Quality */}
              <div className="flex items-start sm:items-center gap-2">
                <IconShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2] mt-0.5 sm:mt-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-[11px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                    Premium Quality
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                    Built to last
                  </span>
                </div>
              </div>

              {/* Trust 3: 10K+ Customers */}
              <div className="flex items-start sm:items-center gap-2">
                <IconStarOutline className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2] mt-0.5 sm:mt-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-[11px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                    10K+ Customers
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                    Love TeenZos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: Main Product & Interactive Stage (~55%)
              ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col items-center justify-center min-h-[320px] sm:min-h-[380px] lg:min-h-[430px] xl:min-h-[470px] w-full pt-4">
            
            {/* Top-Right Pink Graffiti Crown */}
            <div className="absolute top-1 sm:top-2 right-[18%] sm:right-[22%] lg:right-[18%] z-10 transform rotate-12 pointer-events-none">
              <PinkGraffitiCrown className="w-8 h-6 sm:w-11 sm:h-9 md:w-13 md:h-10" />
            </div>

            {/* Right-Side Handwritten Statement */}
            <div className="absolute top-6 sm:top-10 right-1 sm:right-4 lg:right-1 z-10 text-left pointer-events-none transform rotate-[-10deg]">
              <p
                className="font-marker font-bold text-[#0B0D0E] text-[11px] sm:text-xs md:text-sm lg:text-[15px] leading-[1.15] tracking-wide uppercase"
                style={{ fontFamily: "var(--font-marker)" }}
              >
                NOT
                <br />
                JUST
                <br />
                CLOTHES,
                <br />
                IT&apos;S A
                <br />
                LIFESTYLE.
              </p>
            </div>

            {/* Right-Side Graffiti Cross ✕ */}
            <div className="absolute bottom-[22%] sm:bottom-[24%] right-3 sm:right-6 lg:right-3 z-10 pointer-events-none transform rotate-12">
              <GraffitiCross className="w-5 h-5 sm:w-6 sm:h-6 text-[#0B0D0E]" />
            </div>

            {/* Main Product Hoodie Image (Compact & Crisp) */}
            <div className="relative w-full max-w-[300px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[450px] xl:max-w-[480px] aspect-[1319/1192] flex items-center justify-center my-auto">
              <div
                className={`relative w-full h-full transition-all duration-300 ease-out transform ${
                  isFading
                    ? "opacity-40 scale-[0.98] blur-[1px]"
                    : "opacity-100 scale-100 blur-0"
                }`}
              >
                <Image
                  src={activeProduct.image}
                  alt={activeProduct.alt}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 38vw"
                  className="object-contain object-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.20)] pointer-events-none"
                />
              </div>
            </div>

            {/* =========================================================
                PRODUCT THUMBNAIL SWITCHER
                Floating rounded container at the bottom-right of the hero
                ========================================================= */}
            <div className="w-full sm:w-auto flex justify-center sm:justify-end lg:absolute lg:bottom-1 lg:right-1 z-20 mt-3 sm:mt-0">
              <div
                role="tablist"
                aria-label="Product color variants switcher"
                className="inline-flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-black/10 shadow-xl shadow-black/10"
              >
                {products.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      role="tab"
                      aria-selected={isSelected}
                      aria-label={`Select ${item.name}`}
                      tabIndex={0}
                      onClick={() => handleSelectProduct(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectProduct(idx);
                        }
                      }}
                      className={`relative w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 outline-none flex items-center justify-center ${
                        isSelected
                          ? "border-2 border-[#F72585] ring-2 ring-[#F72585]/20 bg-pink-50/20 shadow-sm scale-105"
                          : "border border-black/10 bg-stone-100/70 hover:border-black/30 hover:scale-105 hover:bg-stone-100"
                      }`}
                    >
                      <div className="relative w-full h-full p-1">
                        <Image
                          src={item.thumbnail}
                          alt={item.alt}
                          fill
                          unoptimized
                          sizes="50px"
                          className="object-contain object-center p-0.5"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
