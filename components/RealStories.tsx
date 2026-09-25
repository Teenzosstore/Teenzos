"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

// ==========================================
// SVG CROWN & INSTAGRAM GRAPHICS
// ==========================================

function PinkCrownOutline({ className = "" }: { className?: string }) {
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
        stroke="#F72585"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ==========================================
// REAL STORIES / INSTAGRAM FEATURED COMPONENT
// ==========================================

const INSTAGRAM_THUMBNAILS = [
  { id: "grid-1", image: "/images/real_stories/real_stories1.jpeg", alt: "TeenZos customer photo 1" },
  { id: "grid-2", image: "/images/real_stories/real_stories2.jpeg", alt: "TeenZos customer photo 2" },
  { id: "grid-3", image: "/images/real_stories/real_stories3.jpeg", alt: "TeenZos customer photo 3" },
  { id: "grid-4", image: "/images/real_stories/real_stories4.jpeg", alt: "TeenZos customer photo 4" },
  { id: "grid-5", image: "/images/real_stories/real_stories5.jpeg", alt: "TeenZos customer photo 5" },
];

export default function RealStories() {
  return (
    <section
      aria-label="Real People Real Stories - Tag us @teenzosstore"
      className="w-full bg-[#FAFAFA] py-10 sm:py-12 md:py-14 lg:py-16 select-none overflow-hidden"
    >
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          
          {/* =========================================================
              LEFT COLUMN: Tilted Overlapping Streetwear Photos (~55%)
              ========================================================= */}
          <div className="lg:col-span-6 relative flex items-center justify-center py-4 sm:py-6">
            <div className="relative w-full max-w-[560px] aspect-[4/3] flex items-center justify-center">
              
              {/* Photo 1: Left Main Card (r1.jpg - Black Tee Good Bad Habits) */}
              <div className="absolute left-0 top-0 w-[55%] aspect-[3.6/4.4] rounded-[5px] overflow-hidden shadow-xl shadow-black/15 transform -rotate-[6deg] hover:rotate-0 transition-transform duration-500 z-10">
                <Image
                  src="/images/real_stories/r1.jpg"
                  alt="TeenZos customer wearing Good Bad Habits graphic tee"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 30vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Photo 2: Top Right Card (r3.jpg - Girl in White Tee & Black Cap) */}
              <div className="absolute right-0 lg:right-[-20px] top-0 w-[48%] aspect-[3.6/4.4] rounded-[5px] overflow-hidden shadow-xl shadow-black/15 transform rotate-[5deg] hover:rotate-0 transition-transform duration-500 z-20 ">
                <Image
                  src="/images/real_stories/r3.jpg"
                  alt="TeenZos customer wearing Cyber Bunny white tee and cap"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 45vw, 25vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Photo 3: Bottom Overlapping Front Card (r2.jpg - Guy in White Back Print Tee) */}
              <div className="absolute left-[28%] bottom-0 w-[50%] aspect-[3.5/3] rounded-[5px] overflow-hidden shadow-2xl shadow-black/25 transform rotate-[2deg] hover:rotate-0 transition-transform duration-500 z-30">
                <Image
                  src="/images/real_stories/r2.jpg"
                  alt="TeenZos customer wearing Strong Habits Good People tee"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover object-center"
                />
              </div>

            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: Hashtag, Headline, Grid & Instagram CTA (~45%)
              ========================================================= */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left relative pl-0 lg:pl-[120px]">
            
            {/* Top Right Pink Crown Outline */}
            <div className="absolute -top-6 right-2 sm:right-6 lg:right-4 pointer-events-none transform rotate-12">
              <PinkCrownOutline className="w-12 h-10 sm:w-16 sm:h-16 md:w-20 md:h-16" />
            </div>

            {/* Hashtag */}
            <span className="font-body font-bold text-xs sm:text-sm text-[#F72585] tracking-widest uppercase mb-6">
              #TEENZOS
            </span>

            {/* Main Headline */}
            <h2 className="font-display font-[350] text-[#0B0D0E] text-3xl sm:text-4xl md:text-[44px] lg:text-[48px] uppercase tracking-[0.10em] leading-[1.1] mb-3">
              REAL PEOPLE.
            </h2>

             <h2 className="font-display font-[350] text-[#0B0D0E] text-3xl sm:text-4xl md:text-[44px] lg:text-[48px] uppercase tracking-[0.10em] leading-[1.1] mb-3"> REAL STORIES.</h2>

            {/* Subtitle */}
            <p className="font-body font-medium text-[#6B7073] text-sm sm:text-base leading-normal mb-6">
              Tag us <span className="text-[#0B0D0E] font-bold">@teenzosstore</span> to get featured.
            </p>

            {/* 5 Customer Photo Thumbnails Row */}
            <div className="grid grid-cols-5 gap-2 sm:gap-2.5 max-w-[500px] mb-8">
              {INSTAGRAM_THUMBNAILS.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square w-full rounded-[5px] overflow-hidden border border-stone-200 shadow-sm group cursor-pointer"
                >
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    unoptimized
                    sizes="90px"
                    className="object-cover object-top transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>

            {/* Instagram CTA Button */}
            <div>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#F72585] hover:bg-[#D91668] text-white font-body font-bold text-xs sm:text-sm uppercase tracking-wider px-7 sm:px-8 py-3.5 sm:py-4 rounded-[5px] shadow-md shadow-[#F72585]/30 hover:shadow-lg hover:shadow-[#F72585]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <span>FOLLOW US ON INSTAGRAM</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-base leading-none">
                  →
                </span>
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
