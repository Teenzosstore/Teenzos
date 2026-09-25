"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";

// =========================================================================
// STREETWEAR VECTOR GRAPHICS MATCHING REFERENCE IMAGE
// =========================================================================

/**
 * Streetwear Pink Graffiti Drip Crown
 * 4-peak street marker crown with drip lines and splatter drops
 */
function GraffitiCrown({ className = "w-12 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 74 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 4-Peak Street Marker Crown Outline */}
      <path
        d="M 6 36 L 10 14 L 25 25 L 37 8 L 49 24 L 64 12 L 60 37 Z"
        stroke="#F72585"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crown Base Line with marker curvature */}
      <path
        d="M 7 40 C 24 43, 46 43, 61 40"
        stroke="#F72585"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* Spray Drip 1 */}
      <path
        d="M 20 42 L 20 52 C 20 54 23 54 23 52 L 23 42"
        stroke="#F72585"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Spray Drip 2 */}
      <path
        d="M 46 42 L 46 54 C 46 56 49 56 49 54 L 49 42"
        stroke="#F72585"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Spray Droplet */}
      <circle cx="34" cy="48" r="1.8" fill="#F72585" />
    </svg>
  );
}

/**
 * Pink Accent Slash Lines (to the left of NEWSLETTER)
 */
function AccentSlashes({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-1 sm:gap-1.5 select-none ${className}`} aria-hidden="true">
      <span className="w-4 sm:w-6 h-[3.5px] sm:h-[4px] bg-[#F72585] rounded-full transform -rotate-[32deg] block shadow-sm shadow-pink-500/30" />
      <span className="w-3.5 sm:w-5 h-[3.5px] sm:h-[4px] bg-[#F72585] rounded-full transform -rotate-[32deg] block translate-x-1 sm:translate-x-1.5 shadow-sm shadow-pink-500/30" />
    </div>
  );
}

/**
 * Dot Matrix Pattern
 */
function DotMatrix({
  cols = 6,
  rows = 3,
  dotColor = "bg-[#F72585]/45",
  className = "",
}: {
  cols?: number;
  rows?: number;
  dotColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-2 pointer-events-none select-none ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      ))}
    </div>
  );
}

/**
 * Electric Cyan Lightning Bolt
 * Located at bottom-right over the black brush stroke with double outline
 */
function CyanLightning({ className = "" }: { className?: string }) {
  return (
    <div className={`relative select-none pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 54 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(54,184,197,0.75)] transform -rotate-[8deg]"
      >
        {/* Outer Heavy Black Silhouette Stroke */}
        <polygon
          points="32,2 8,38 26,38 18,70 48,28 30,28"
          stroke="#0B0D0E"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        {/* Bright Neon Cyan Fill & Bright Cyan Stroke */}
        <polygon
          points="32,2 8,38 26,38 18,70 48,28 30,28"
          fill="#36B8C5"
          stroke="#5CE1E6"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner Highlight Reflection */}
        <polyline
          points="30,8 14,36 26,36"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

// =========================================================================
// 4 BENEFIT ICONS (Vector art matching reference image)
// =========================================================================

function IconExclusiveDiscounts() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F72585"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mx-auto mb-1.5 sm:mb-2 text-[#F72585]"
      aria-hidden="true"
    >
      <circle cx="7.5" cy="7.5" r="2.2" />
      <circle cx="16.5" cy="16.5" r="2.2" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function IconNewArrivals() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F72585"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mx-auto mb-1.5 sm:mb-2 text-[#F72585]"
      aria-hidden="true"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconDropAlerts() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F72585"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mx-auto mb-1.5 sm:mb-2 text-[#F72585]"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconSpecialOffers() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F72585"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mx-auto mb-1.5 sm:mb-2 text-[#F72585]"
      aria-hidden="true"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" rx="1" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

const BENEFITS = [
  {
    icon: IconExclusiveDiscounts,
    titleTop: "EXCLUSIVE",
    titleBottom: "DISCOUNTS",
  },
  {
    icon: IconNewArrivals,
    titleTop: "NEW ARRIVALS",
    titleBottom: "FIRST",
  },
  {
    icon: IconDropAlerts,
    titleTop: "DROP",
    titleBottom: "ALERTS",
  },
  {
    icon: IconSpecialOffers,
    titleTop: "SPECIAL",
    titleBottom: "OFFERS",
  },
];

// =========================================================================
// MAIN NEWSLETTER CTA COMPONENT
// =========================================================================

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubscribed(true);
        showToast("Welcome to the TeenZos crew!", "success");
      } else {
        if (res.status === 409) {
          setSubscribed(true);
          showToast(data.error || "You're already subscribed!", "info");
        } else {
          showToast(data.error || "Failed to subscribe. Please try again.", "error");
        }
      }
    } catch {
      setSubscribed(true);
      showToast("Welcome to the TeenZos crew!", "success");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-label="Join Our Newsletter"
      className="relative w-full overflow-hidden bg-[#FAF9F6] border-y border-black/5 select-none"
    >
      {/* ── Background Texture Image (bg_image.png) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        <Image
          src="/images/bg_image.png"
          alt="TeenZos Newsletter Streetwear Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Subtle white veil on mobile for crystal clear contrast while preserving edge brush strokes */}
        <div className="absolute inset-0 bg-white/45 sm:bg-white/20 lg:bg-transparent pointer-events-none" />
      </div>

      {/* ── Cyan Lightning Bolt (Bottom Right Corner) ── */}
      <div className="absolute bottom-2 right-3 sm:bottom-5 sm:right-6 md:bottom-6 md:right-10 z-10 w-11 h-14 sm:w-14 sm:h-18 md:w-18 md:h-22 lg:w-20 lg:h-26">
        <CyanLightning className="w-full h-full" />
      </div>

      {/* ── Decorative Dot Matrix (Top Right) ── */}
      <div className="absolute top-4 sm:top-6 right-16 sm:right-24 md:right-32 hidden sm:block z-0 opacity-50">
        <DotMatrix cols={7} rows={3} dotColor="bg-[#9CA3AF]/60" />
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
          
          {/* =========================================================
              LEFT COLUMN: Eyebrow, Heading with Crown & Subtitle
              ========================================================= */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center text-left pl-3 sm:pl-4 md:pl-0">
            {/* Eyebrow: STAY IN THE LOOP — */}
            <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
              <span className="font-body font-bold text-[10px] sm:text-xs tracking-[0.22em] text-[#22262A] uppercase">
                STAY IN THE LOOP
              </span>
              <span className="w-6 sm:w-10 h-[1.5px] bg-[#22262A]/60" />
            </div>

            {/* Headline: JOIN OUR NEWSLETTER */}
            <div className="relative flex flex-col items-start">
              {/* Line 1: JOIN OUR */}
              <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] lg:text-[62px] xl:text-[70px] uppercase tracking-[0.15em] text-[#0B0D0E] leading-[0.92] m-0 p-0">
                JOIN OUR
              </h2>

              {/* Line 2: NEWSLETTER with Crown and Slashes */}
              <div className="relative inline-flex items-center mt-0.5 sm:mt-1">
                {/* Accent Slash Marks to the left */}
                <div className="absolute left-5 sm:-left-7 md:-left-8 top-1/2 -translate-y-1/2">
                  <AccentSlashes />
                </div>

                {/* Main Pink Word */}
                <span className="font-display text-4xl sm:text-5xl md:text-[56px] lg:text-[62px] xl:text-[70px] uppercase tracking-[0.15em] text-[#F72585] leading-[0.92]">
                  NEWSLETTER
                </span>

                {/* Pink Graffiti Drip Crown above the end of NEWSLETTER */}
                <div className="absolute -top-7 sm:-top-8 md:-top-10 -right-2 sm:-right-4 md:-right-6 transform rotate-[12deg] pointer-events-none">
                  <GraffitiCrown className="w-10 h-8 sm:w-12 sm:h-10 md:w-14 md:h-11" />
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p className="font-body text-[#374151] text-xs sm:text-sm md:text-[14px] font-normal mt-3 sm:mt-3.5 max-w-[420px] leading-relaxed">
              Get exclusive drops, early access, special offers and the latest updates straight to your inbox.
            </p>

            {/* Decorative Dot Matrix (Bottom Left) */}
            <div className="mt-4 sm:mt-5 opacity-65">
              <DotMatrix cols={6} rows={3} dotColor="bg-[#F72585]/45" />
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: Subscription Input Form & 4 Benefit Badges
              ========================================================= */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center lg:items-end">
            <div className="w-full max-w-[650px]">
              
              {/* ── Email Subscription Pill Container ── */}
              {subscribed ? (
                <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white/95 backdrop-blur-md border border-[#F72585]/40 text-[#0B0D0E] p-2  rounded-[5px] shadow-[0_8px_30px_rgba(247,37,133,0.15)] w-full">
                  <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 min-w-0">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-[5px] bg-[#F72585] text-white flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="font-body font-semibold text-xs sm:text-sm text-[#0B0D0E] truncate">
                      You&apos;re officially on the VIP list. Watch your inbox!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubscribed(false);
                      setEmail("");
                    }}
                    className="font-body text-[11px] sm:text-xs font-bold text-[#F72585] hover:underline pr-2 sm:pr-4 shrink-0 uppercase tracking-wider"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="relative flex items-center w-full bg-white rounded-full border border-[#D5D9DC] shadow-[0_6px_25px_rgba(0,0,0,0.06)] p-2 pl-4 transition-all duration-300 focus-within:border-[#F72585] focus-within:shadow-[0_8px_30px_rgba(247,37,133,0.18)]"
                >
                  {/* Envelope Icon */}
                  <div className="text-[#374151] shrink-0 mr-2 sm:mr-3 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#2D3134]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <polyline points="3 7 12 13 21 7" />
                    </svg>
                  </div>

                  {/* Email Input Field */}
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Enter your email address"
                    className="flex-1 min-w-0 bg-transparent py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-[15px] text-[#0B0D0E] placeholder:text-[#8B9196] font-body !outline-none"
                  />

                  {/* Hot Pink Subscribe Pill Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#F72585] hover:bg-[#D91668] active:scale-95 text-white font-body font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full transition-all duration-200 shrink-0 shadow-[0_4px_16px_rgba(247,37,133,0.38)] disabled:opacity-70 cursor-pointer"
                  >
                    <span>{loading ? "JOINING..." : "SUBSCRIBE"}</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-xs sm:text-sm md:text-base leading-none">
                      →
                    </span>
                  </button>
                </form>
              )}

              {/* ── 4 Benefit Features (Below the Input Form) ── */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 items-center justify-between w-full mt-5 sm:mt-7 pt-1 sm:pt-2">
                {BENEFITS.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={index}
                      className={`flex flex-col items-center text-center px-1 sm:px-2 ${
                        index !== BENEFITS.length - 1 ? "border-r border-[#D5D9DC]/80" : ""
                      }`}
                    >
                      <IconComponent />
                      <span className="font-body font-extrabold text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs text-[#0B0D0E] tracking-tight uppercase leading-tight">
                        {item.titleTop}
                      </span>
                      <span className="font-body font-extrabold text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs text-[#0B0D0E] tracking-tight uppercase leading-tight">
                        {item.titleBottom}
                      </span>
                    </div>
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