"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useCallback, useEffect } from "react";

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
  slides,
  leftText,
}: {
  products?: HeroProductItem[];
  slides?: any[];
  backgroundImages?: any[];
  leftText?: any;
}) {
  // Use slides from Supabase if present, or fallback to products/HERO_PRODUCTS
  const displayProducts: HeroProductItem[] =
    slides && slides.length > 0
      ? slides
          .filter((s: any) => s.is_active !== false)
          .map((s: any, idx: number) => ({
            id: s.id || `slide-${idx}`,
            name: s.title || `Cyber Bunny Hoodie ${idx + 1}`,
            colorName: s.subtitle || `Style ${idx + 1}`,
            image: s.image_url,
            thumbnail: s.image_url,
            alt: s.title || "TeenZos Streetwear Hoodie",
          }))
      : products && products.length > 0
      ? products
      : HERO_PRODUCTS;

  const finalProducts = displayProducts.length > 0 ? displayProducts : HERO_PRODUCTS;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const activeProduct = finalProducts[selectedIndex] || finalProducts[0];

  const handleSelectProduct = useCallback(
    (index: number) => {
      if (index === selectedIndex) return;
      setIsFading(true);
      setTimeout(() => {
        setSelectedIndex(index);
        setIsFading(false);
      }, 130);
    },
    [selectedIndex]
  );

  // Automatic slow & infinite photo rotation (synchronized with thumbnail switcher)
  useEffect(() => {
    if (!finalProducts || finalProducts.length <= 1) return;

    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setSelectedIndex((prev) => (prev + 1) % finalProducts.length);
        setIsFading(false);
      }, 130);
    }, 2000); // 2 seconds slow, smooth rotation

    return () => clearInterval(timer);
  }, [finalProducts, selectedIndex]);

  const eyebrow = leftText?.eyebrow || "STREETWEAR";
  const headlineTop = leftText?.headline_top || "EXPRESS WHAT";
  const headlineAccent = leftText?.headline_accent || "MOVES YOU";
  const subtitle = leftText?.subtitle || "Bold designs. Premium comfort.\nMore than clothes, it’s a mindset.";
  const buttonText = leftText?.button_text || "Shop Now";
  const buttonLink = leftText?.button_link || "/shop";
  const secondaryButtonText = leftText?.secondary_button_text || "Explore Collections";
  const secondaryButtonLink = leftText?.secondary_button_link || "/shop";

  return (
    <section
      id="home"
      aria-label="TeenZos Streetwear Hero Section"
      className="relative w-full overflow-hidden bg-[#F1F1EF] text-[#0B0D0E] select-none"
    >
      {/* ── Preload hidden container for instant switcher switching ── */}
      <div className="hidden" aria-hidden="true">
        {finalProducts.map((p) => (
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
      <div className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-[108px] sm:pt-[116px] md:pt-[124px] lg:pt-[116px] pb-4 sm:pb-8 lg:pb-6 min-h-[auto] lg:min-h-[580px] xl:min-h-[640px] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 lg:gap-4 items-center w-full my-auto">
          
          {/* =========================================================
              LEFT COLUMN: Brand Copy, CTAs, Trust Indicators (~45%)
              ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left justify-center z-10 py-1 sm:py-4">
            {/* Eyebrow */}
            <div className="mb-2 sm:mb-2">
              <span className="text-[11px] sm:text-[12px] font-bold tracking-[0.26em] text-[#0B0D0E] uppercase inline-block">
                {eyebrow}
              </span>
            </div>

            {/* Headline */}
            <h1 className="flex flex-col items-center lg:items-start uppercase tracking-tight w-full">
              {/* Line 1: EXPRESS WHAT */}
              <span className="font-display font-black text-[#0B0D0E] text-[2.2rem] xs:text-[2.7rem] sm:text-[4rem] md:text-[4.8rem] lg:text-[4.4rem] xl:text-[5.2rem] leading-[0.9] mb-1">
                {headlineTop}
              </span>

              {/* Line 2: MOVES YOU + Brush Underline */}
              <div className="relative inline-block mt-1 sm:mt-3 lg:mt-5 mx-auto lg:mx-0">
                <span className="font-display font-black tracking-tight text-[#F72585] text-[2.1rem] xs:text-[2.5rem] sm:text-[3.8rem] md:text-[4.6rem] lg:text-[4.2rem] xl:text-[5rem] leading-[0.9] block transform -skew-x-6">
                  {headlineAccent}
                </span>
                {/* Brush underline stroke */}
                <div className="w-[88%] sm:w-[80%] mt-0.5 sm:mt-1.5 mx-auto lg:mx-0 transform -rotate-1">
                  <PinkBrushUnderline className="w-full h-2 sm:h-3 md:h-3.5 text-[#F72585]" />
                </div>
              </div>
            </h1>

            {/* Supporting Text */}
            <div className="mt-2.5 sm:mt-4 text-[#1A1E20] text-xs sm:text-sm md:text-[15px] font-medium leading-relaxed max-w-[420px] mx-auto lg:mx-0">
              <p className="whitespace-pre-line">{subtitle}</p>
            </div>

            {/* Two CTA Buttons */}
            <div className="flex flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3 mt-3.5 sm:mt-6 w-full sm:w-auto">
              {/* Primary Pink Button */}
              <Link
                href={buttonLink}
                className="group flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#F72585] hover:bg-[#D91668] text-white font-semibold text-xs sm:text-sm px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-[5px] shadow-md shadow-[#F72585]/30 hover:shadow-lg hover:shadow-[#F72585]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <span>{buttonText}</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-sm sm:text-base leading-none">
                  →
                </span>
              </Link>

              {/* Secondary Outline Button */}
              <Link
                href={secondaryButtonLink}
                className="group flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-transparent hover:bg-black/5 text-[#0B0D0E] font-semibold text-xs sm:text-sm px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-[5px] border-[1.8px] border-[#0B0D0E]/80 hover:border-[#0B0D0E] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap"
              >
                <span>{secondaryButtonText}</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-sm sm:text-base leading-none">
                  →
                </span>
              </Link>
            </div>

            {/* Trust Indicators (Desktop) */}
            <div className="hidden lg:grid mt-8 pt-5 border-t border-black/10 grid-cols-3 gap-3 max-w-[480px] w-full mx-0">
              {/* Trust 1: Free Shipping */}
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-2">
                <IconTruck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2]" />
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                    Free Shipping
                  </span>
                  <span className="text-[9px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                    On all orders
                  </span>
                </div>
              </div>

              {/* Trust 2: Premium Quality */}
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-2">
                <IconShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2]" />
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                    Premium Quality
                  </span>
                  <span className="text-[9px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                    Built to last
                  </span>
                </div>
              </div>

              {/* Trust 3: 10K+ Customers */}
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-2">
                <IconStarOutline className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2]" />
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                    10K+ Customers
                  </span>
                  <span className="text-[9px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                    Love TeenZos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: Main Product & Interactive Stage (~55%)
              ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col items-center justify-center min-h-[220px] xs:min-h-[260px] sm:min-h-[380px] lg:min-h-[490px] xl:min-h-[550px] w-full pt-1 sm:pt-4">
            
            {/* Top-Right Streetwear Badge: Crown Icon with Handwritten Statement Directly Underneath */}
            <div className="absolute top-1 sm:top-4 md:top-6 lg:top-8 right-1 sm:right-3 md:right-5 lg:right-3 xl:right-6 z-10 flex flex-col items-center pointer-events-none transform rotate-[-8deg] sm:rotate-[-10deg]">
              {/* Pink Graffiti Crown Icon */}
              <div className="transform rotate-12 mb-0.5 sm:mb-1.5">
                <PinkGraffitiCrown className="w-5 h-4 xs:w-6 xs:h-5 sm:w-9 sm:h-7 md:w-11 md:h-9 lg:w-12 lg:h-10" />
              </div>

              {/* Handwritten Statement Directly Underneath Icon */}
              <p
                className="font-marker font-bold text-[#0B0D0E] text-[8px] xs:text-[9.5px] sm:text-xs md:text-sm lg:text-[15px] leading-[1.1] sm:leading-[1.15] tracking-wide uppercase text-center select-none"
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


            {/* Main Product Hoodie Image (Expanded Desktop Size with Crisp Proportions) */}
            <div className="relative w-full max-w-[250px] xs:max-w-[280px] sm:max-w-[360px] md:max-w-[380px] lg:max-w-[490px] xl:max-w-[560px] aspect-[1319/1192] flex items-center justify-center my-auto">
              {/* Subtle ambient streetwear aura glow */}
              <div className="absolute inset-4 sm:inset-8 bg-gradient-to-tr from-[#F72585]/15 via-[#36B8C5]/15 to-transparent rounded-full blur-2xl pointer-events-none -z-10 animate-pulse" />

              {/* Smooth Floating Levitation Wrapper */}
              <div className="relative w-full h-full animate-floatSlow flex items-center justify-center">
                {/* Image Swap Pop/Fade Animation */}
                <div
                  className={`relative w-full h-full transition-all duration-300 ease-out transform ${
                    isFading
                      ? "opacity-20 scale-95 translate-y-1 rotate-[-1deg] blur-[0.5px]"
                      : "opacity-100 scale-100 translate-y-0 rotate-0 blur-0"
                  }`}
                >
                  <Image
                    src={activeProduct.image}
                    alt={activeProduct.alt}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 768px) 70vw, (max-width: 1200px) 45vw, 38vw"
                    className="object-contain object-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.22)] pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* =========================================================
                PRODUCT THUMBNAIL SWITCHER
                Floating rounded container at the bottom-right of the hero
                ========================================================= */}
            <div className="w-full sm:w-auto flex justify-center sm:justify-end lg:absolute lg:bottom-1 lg:right-1 z-20 mt-1.5 sm:mt-0">
              <div
                role="tablist"
                aria-label="Product color variants switcher"
                className="inline-flex items-center gap-1.5 sm:gap-2 p-1 sm:p-2 bg-white/95 backdrop-blur-md rounded-[5px] border border-black/10 shadow-lg shadow-black/5"
              >
                {finalProducts.map((item, idx) => {
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
                      className={`relative w-9 h-9 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-[5px] overflow-hidden cursor-pointer transition-all duration-200 outline-none flex items-center justify-center ${
                        isSelected
                          ? "border-2 border-[#F72585] ring-2 ring-[#F72585]/20 bg-pink-50/20 shadow-sm"
                          : "border border-black/10 bg-stone-100/70 hover:border-black/30 hover:bg-stone-100"
                      }`}
                    >
                      <div className="relative w-full h-full p-0.5 sm:p-1">
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

        {/* Trust Indicators (Mobile: placed at the end of Hero section) */}
        <div className="lg:hidden bg-white mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-black/10 grid grid-cols-3 gap-1.5 sm:gap-3 max-w-[570px] w-full mx-auto py-4 rounded">
          {/* Trust 1: Free Shipping */}
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-2">
            <IconTruck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2]" />
            <div className="flex flex-col">
              <span className="font-bold text-[10px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                Free Shipping
              </span>
              <span className="text-[9px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                On all orders
              </span>
            </div>
          </div>

          {/* Trust 2: Premium Quality */}
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-2">
            <IconShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2]" />
            <div className="flex flex-col">
              <span className="font-bold text-[10px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                Premium Quality
              </span>
              <span className="text-[9px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                Built to last
              </span>
            </div>
          </div>

          {/* Trust 3: 10K+ Customers */}
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-2">
            <IconStarOutline className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0D0E] shrink-0 stroke-[2.2]" />
            <div className="flex flex-col">
              <span className="font-bold text-[10px] sm:text-[12px] text-[#0B0D0E] leading-tight">
                10K+ Customers
              </span>
              <span className="text-[9px] sm:text-[10.5px] text-[#6B7073] font-normal leading-tight">
                Love TeenZos
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
