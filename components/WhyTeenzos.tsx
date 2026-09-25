"use client";

import React from "react";
import Image from "next/image";

interface WhyTeenzosFeature {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  alt: string;
}

const FEATURES: WhyTeenzosFeature[] = [
  {
    id: "premium-quality",
    title: "Premium Quality",
    subtitle: "Soft, breathable & durable",
    icon: "/images/icons/icon1.png",
    alt: "Premium Quality Diamond Icon",
  },
  {
    id: "bold-original",
    title: "Bold & Original",
    subtitle: "Designs you won't find anywhere else",
    icon: "/images/icons/icon2.png",
    alt: "Bold & Original Palette Icon",
  },
  {
    id: "made-for-you",
    title: "Made for You",
    subtitle: "Oversized fits. Everyday style.",
    icon: "/images/icons/icon3.png",
    alt: "Made for You Heart Icon",
  },
  {
    id: "growing-community",
    title: "Growing Community",
    subtitle: "10K+ happy customers",
    icon: "/images/icons/icon4.png",
    alt: "Growing Community People Icon",
  },
  {
    id: "sustainable-steps",
    title: "Sustainable Steps",
    subtitle: "Conscious fashion, better tomorrow.",
    icon: "/images/icons/icon5.png",
    alt: "Sustainable Steps Leaves Icon",
  },
];

export default function WhyTeenzos() {
  return (
    <section
      aria-label="Why TeenZos"
      className="w-full bg-white text-[#0B0D0E] py-10 sm:py-12 md:py-14 lg:py-16 border-b border-stone-200/80"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        
        {/* ==========================================
            HEADER: Eyebrow + Headline (Left Aligned)
            ========================================== */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <p
            className="font-body font-semibold text-xs sm:text-sm tracking-wider uppercase text-[#6B7073] mb-1.5"
            style={{ fontFamily: "var(--font-body)" }}
          >
            WHY TEENZOS?
          </p>
          <h2
            className="font-display font-[400] text-3xl sm:text-4xl md:text-[42px] lg:text-[46px] uppercase tracking-tight text-[#0B0D0E] leading-[1.08]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            MORE THAN JUST CLOTHES
          </h2>
        </div>

        {/* ========================================================
            DESKTOP & TABLET VIEW (>= md: 768px): 5 Columns with Dividers
            ======================================================== */}
        <div className="hidden md:grid md:grid-cols-5 items-stretch divide-x divide-stone-200/80">
          {FEATURES.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center text-center px-3 lg:px-5 group cursor-default"
            >
              {/* Icon Container */}
              <div className="relative w-12 h-12 lg:w-14 lg:h-14 mb-3 sm:mb-3.5 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <Image
                  src={item.icon}
                  alt={item.alt}
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Title */}
              <h3
                className="font-body font-bold text-sm lg:text-[15px] xl:text-base text-[#0B0D0E] leading-snug mb-1"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {item.title}
              </h3>

              {/* Subtitle */}
              <p
                className="font-body text-xs lg:text-[13px] text-[#6B7073] font-normal leading-relaxed max-w-[210px]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* ========================================================
            MOBILE VIEW (< md: 768px): Clean Balanced 2-Column Grid
            ======================================================== */}
        <div className="grid grid-cols-2 md:hidden gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-8">
          {FEATURES.map((item, index) => {
            const isLastOdd = index === FEATURES.length - 1;

            return (
              <div
                key={item.id}
                className={`flex flex-col items-center text-center p-2 group ${
                  isLastOdd ? "col-span-2 max-w-[280px] mx-auto" : ""
                }`}
              >
                {/* Icon Container */}
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 mb-2.5 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                  <Image
                    src={item.icon}
                    alt={item.alt}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Title */}
                <h3
                  className="font-body font-bold text-[13.5px] sm:text-sm text-[#0B0D0E] leading-snug mb-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {item.title}
                </h3>

                {/* Subtitle */}
                <p
                  className="font-body text-[11.5px] sm:text-xs text-[#6B7073] font-normal leading-relaxed max-w-[190px]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
