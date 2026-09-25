"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

// ==========================================
// COLLECTIONS DATA
// ==========================================

const EXPLORE_COLLECTIONS = [
  {
    id: "oversized",
    title: "OVERSIZED",
    subtitle: "Relaxed. Bold. Everyday.",
    image: "/images/explore/img01.png",
    link: "/shop?category=oversized-tees",
    alt: "TeenZos Oversized Streetwear Collection",
  },
  {
    id: "graphic-tees",
    title: "GRAPHIC TEES",
    subtitle: "Designs that speak.",
    image: "/images/explore/img_02.png",
    link: "/shop?category=acid-wash",
    alt: "TeenZos Graphic Streetwear Tees Collection",
  },
  {
    id: "streetwear",
    title: "STREETWEAR",
    subtitle: "Built for the streets.",
    image: "/images/explore/img_03.png",
    link: "/shop?category=streetwear-collection",
    alt: "TeenZos Streetwear Hoodies and Drops Collection",
  },
  {
    id: "new-arrivals",
    title: "NEW ARRIVALS",
    subtitle: "Fresh drops. Fresh energy.",
    image: "/images/explore/img_04.png",
    link: "/shop?category=new-drops",
    alt: "TeenZos New Arrivals and Fresh Drops Collection",
  },
];

// ==========================================
// CATEGORIES / SHOP BY COLLECTION COMPONENT
// ==========================================

export default function Categories({
  categories = [],
}: {
  categories?: any[];
}) {
  return (
    <section
      id="categories"
      aria-label="Shop By Collection"
      className="w-full bg-[#F7F7F5] py-8 sm:py-12 md:py-14 lg:py-16 overflow-hidden select-none"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        
        {/* ── Section Header ── */}
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8 md:mb-10">
          <div className="flex flex-col">
            <span className="font-body font-medium  text-[11px] sm:text-xs md:text-[13px] text-[#6B7073] tracking-[0.24em] uppercase mb-2 ml-1">
              EXPLORE
            </span>
            <h2 className="font-display font-[350] text-[#0B0D0E] text-2xl sm:text-3xl md:text-4xl lg:text-[42px] tracking-tight uppercase leading-none">
              SHOP BY COLLECTION
            </h2>
          </div>

          <Link
            href="/shop"
            className="group font-body font-bold text-xs sm:text-sm text-[#0B0D0E] hover:text-[#F72585] inline-flex items-center gap-1.5 transition-colors shrink-0 pb-1"
          >
            <span>View All</span>
            <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-sm sm:text-base leading-none">
              →
            </span>
          </Link>
        </div>

        {/* ── Collection Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {EXPLORE_COLLECTIONS.map((col) => (
            <Link
              key={col.id}
              href={col.link}
              className="group relative block aspect-[4.5/5] rounded-[8px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-stone-900"
            >
              {/* Card Image */}
              <Image
                src={col.image}
                alt={col.alt}
                fill
                priority
                sizes="(max-width: 640px) 95vw, (max-width: 1024px) 48vw, 24vw"
                className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Gradient Scrim for Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity duration-300 group-hover:opacity-95" />

              {/* Card Bottom Meta */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-3 z-10">
                <div className="flex flex-col min-w-0 pr-2">
                  <h3 className="font-display font-[320] text-white text-lg sm:text-xl md:text-[22px] lg:text-[21px] xl:text-[23px] uppercase tracking-[0.020em] leading-tight drop-shadow-sm group-hover:text-[#36B8C5] transition-colors duration-200">
                    {col.title}
                  </h3>
                  <p className="text-white/95 text-xs sm:text-[13px] font-medium leading-snug mt-0.5 truncate">
                    {col.subtitle}
                  </p>
                </div>

                {/* Circular Action Arrow Button */}
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[#0B0D0E] group-hover:bg-[#F72585] group-hover:text-white flex items-center justify-center shrink-0 shadow-md transform group-hover:scale-110 transition-all duration-300"
                  aria-hidden="true"
                >
                  <svg
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 transform group-hover:translate-x-0.5 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
