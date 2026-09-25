"use client";

import React from "react";
import Image from "next/image";

export default function ShopHeroBanner() {
  return (
    <section className="relative w-full h-[100px] sm:h-[155px] md:h-[200px] lg:h-[230px] overflow-hidden select-none bg-white border-b border-stone-200">
      {/* Background Graphic Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/shop_banner_bg.png"
          alt="Teenzos Streetwear Collection Banner"
          fill
          priority
          unoptimized
          className="object-cover object-center"
        />
      </div>

      {/* Decorative Accents */}
      <div className="absolute top-2 left-3 sm:top-4 sm:left-6 md:top-6 md:left-12 pointer-events-none opacity-90 hidden xs:block">
        {/* Pink Crown Doodle */}
        <svg
          className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 text-[#F72585] transform -rotate-12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <circle cx="5" cy="18" r="1" fill="#F72585" />
          <circle cx="12" cy="18" r="1" fill="#F72585" />
          <circle cx="19" cy="18" r="1" fill="#F72585" />
        </svg>
      </div>

      <div className="absolute top-2 right-3 sm:top-4 sm:right-6 md:top-6 md:right-12 pointer-events-none opacity-90 hidden xs:block">
        {/* Cyan Lightning Bolt Doodle */}
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#36B8C5] transform rotate-12"
          viewBox="0 0 24 24"
          fill="#36B8C5"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex flex-col justify-center items-center text-center">
        <div className="flex flex-col items-center">
          <h1
            className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#0B0D0E] tracking-wider uppercase italic select-none drop-shadow-sm transform -rotate-0.5"
          >
            SHOP
          </h1>

          <div className="flex items-center gap-2 sm:gap-3.5 mt-1 sm:mt-2">
            <span className="w-5 sm:w-10 md:w-14 h-[2px] bg-[#F72585]" />
            <span className="font-body font-extrabold text-[11px] sm:text-[13px] md:text-sm text-[#0B0D0E] tracking-[0.22em] sm:tracking-[0.32em] uppercase">
              STREETWEAR COLLECTION
            </span>
            <span className="w-5 sm:w-10 md:w-14 h-[2px] bg-[#36B8C5]" />
          </div>
        </div>
      </div>
    </section>
  );
}
