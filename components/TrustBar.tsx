"use client";

import React from "react";

// =========================================================================
// BEST-OF-THE-BEST CONTENT-RELATED ICONS (Clean, Precision Vector Lines)
// =========================================================================

/**
 * 1. Premium Fabric (100% Organic Combed Cotton Boll / Textile Pod)
 * Represents luxury heavyweight cotton fabric, softness & all-day comfort.
 */
function IconPremiumFabric({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cotton pod puffy clouds */}
      <path
        d="M8.5 14C6.5 14 5 12.5 5 10.5C5 8.7 6.3 7.2 8.1 7C8.4 5.3 9.9 4 11.7 4C12.8 4 13.8 4.5 14.5 5.3C15.2 4.5 16.2 4 17.3 4C19.1 4 20.6 5.3 20.9 7C22.7 7.2 24 8.7 24 10.5C24 12.5 22.5 14 20.5 14"
        stroke="#0B0D0E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-2.5, 0.5)"
      />
      {/* Inner contour softness folds */}
      <path
        d="M8.5 9.5C9.5 11 11 12 13 12.5"
        stroke="#0B0D0E"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="translate(-2.5, 0.5)"
      />
      <path
        d="M17.5 9.5C16.5 11 15 12 13 12.5"
        stroke="#0B0D0E"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="translate(-2.5, 0.5)"
      />
      {/* Calyx / Leaf Base */}
      <path
        d="M10.5 14.5L9 18.5C11 17.8 12 17.8 13 19C14 17.8 15 17.8 17 18.5L15.5 14.5"
        stroke="#0B0D0E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-2.5, 0.5)"
      />
      {/* Stem */}
      <path
        d="M13 19V21.5"
        stroke="#0B0D0E"
        strokeWidth="1.8"
        strokeLinecap="round"
        transform="translate(-2.5, 0.5)"
      />
    </svg>
  );
}

/**
 * 2. Unique Designs (Sparkle / 4-Point Starburst & Creative Spark)
 * Represents custom streetwear artwork, exclusivity & standing out.
 */
function IconUniqueDesigns({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Main 4-point design sparkle */}
      <path
        d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
        stroke="#0B0D0E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small accent sparkle top-right */}
      <path
        d="M19 2C19 3.65685 17.6569 5 16 5C17.6569 5 19 6.34315 19 8C19 6.34315 20.3431 5 22 5C20.3431 5 19 3.65685 19 2Z"
        stroke="#0B0D0E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tiny accent spark bottom-left */}
      <circle cx="5.5" cy="18.5" r="1.2" fill="#0B0D0E" />
    </svg>
  );
}

/**
 * 3. COD Available (Indian Rupee ₹ Banknote & Cash Delivery)
 * Represents Cash on Delivery, instant doorstep payment & trust.
 */
function IconCodAvailable({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cash Banknote Outline */}
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2.5"
        stroke="#0B0D0E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Rupee Symbol ₹ */}
      <path
        d="M10 9H14M10 11H13.5C14.3 11 15 11.5 15 12.2C15 13 14.3 13.5 13.5 13.5H10.5L14 16.5"
        stroke="#0B0D0E"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left & Right Security Marks */}
      <circle cx="5" cy="12" r="1" fill="#0B0D0E" />
      <circle cx="19" cy="12" r="1" fill="#0B0D0E" />
    </svg>
  );
}

/**
 * 4. Easy Returns (Package Box with Smooth Return Arrow)
 * Represents hassle-free 7-day doorstep returns & exchanges.
 */
function IconEasyReturns({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Smooth Return Loop Arrow */}
      <path
        d="M3.5 10C4.3 6 8 3 12.5 3C17.7 3 22 7.3 22 12.5C22 17.7 17.7 22 12.5 22C8.5 22 5.1 19.5 3.8 16"
        stroke="#0B0D0E"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <polyline
        points="2 6.5 3.5 10.5 7.5 9"
        stroke="#0B0D0E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center 7 Days / Check Badge */}
      <path
        d="M9.5 12.5L11.5 14.5L15.5 10.5"
        stroke="#0B0D0E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 5. Made in India (Precision Ashoka Chakra Emblem)
 * Represents authentic Indian streetwear craftsmanship & pride.
 */
function IconMadeInIndia({ className = "w-6 h-6 sm:w-7 sm:h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Chakra Rim */}
      <circle cx="12" cy="12" r="9.5" stroke="#0B0D0E" strokeWidth="1.8" />
      {/* Center Hub */}
      <circle cx="12" cy="12" r="2.2" stroke="#0B0D0E" strokeWidth="1.6" fill="#0B0D0E" />
      {/* 8 Principal & Diagonal Spokes */}
      <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="#0B0D0E" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2.5" y1="12" x2="21.5" y2="12" stroke="#0B0D0E" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="5.28" y1="5.28" x2="18.72" y2="18.72" stroke="#0B0D0E" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="5.28" y1="18.72" x2="18.72" y2="5.28" stroke="#0B0D0E" strokeWidth="1.3" strokeLinecap="round" />
      {/* Intermediate Spokes */}
      <line x1="8.36" y1="3.2" x2="15.64" y2="20.8" stroke="#0B0D0E" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <line x1="15.64" y1="3.2" x2="8.36" y2="20.8" stroke="#0B0D0E" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <line x1="3.2" y1="8.36" x2="20.8" y2="15.64" stroke="#0B0D0E" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <line x1="3.2" y1="15.64" x2="20.8" y2="8.36" stroke="#0B0D0E" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

// ==========================================
// DATA CONFIGURATION
// ==========================================

const TRUST_FEATURES = [
  {
    id: "premium-fabric",
    title: "Premium Fabric",
    subtitle: "All day comfort",
    icon: IconPremiumFabric,
  },
  {
    id: "unique-designs",
    title: "Unique Designs",
    subtitle: "Stand out always",
    icon: IconUniqueDesigns,
  },
  {
    id: "cod-available",
    title: "COD Available",
    subtitle: "Pay on delivery",
    icon: IconCodAvailable,
  },
  {
    id: "easy-returns",
    title: "Easy Returns",
    subtitle: "Hassle free",
    icon: IconEasyReturns,
  },
  {
    id: "made-in-india",
    title: "Made in India",
    subtitle: "Proudly Indian",
    icon: IconMadeInIndia,
  },
];

// ==========================================
// TRUST BAR COMPONENT
// ==========================================

export default function TrustBar() {
  return (
    <section
      aria-label="TeenZos Brand Features and Guarantees"
      className="w-full bg-white border-y border-stone-200/90 py-4 sm:py-5 lg:py-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative z-20"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        
        {/* Desktop View (>= 1024px): 5 items with vertical dividers */}
        <div className="hidden lg:flex items-center justify-between gap-2">
          {TRUST_FEATURES.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === TRUST_FEATURES.length - 1;

            return (
              <React.Fragment key={item.id}>
                <div className="flex items-center gap-3.5 group cursor-default">
                  <div className="shrink-0 text-[#0B0D0E] transform group-hover:scale-110 transition-transform duration-200">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[14px] text-[#0B0D0E] leading-tight tracking-tight">
                      {item.title}
                    </span>
                    <span className="text-[12px] text-[#6B7073] font-normal leading-tight mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {!isLast && (
                  <div
                    className="w-[1px] h-8 bg-stone-200/90 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile & Tablet View (< 1024px): Responsive clean grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-y-4 gap-x-3 sm:gap-6 max-w-[500px] sm:max-w-none mx-auto">
          {TRUST_FEATURES.map((item, idx) => {
            const Icon = item.icon;
            const isLastOddOnMobile = idx === TRUST_FEATURES.length - 1;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-center gap-2.5 sm:gap-3 ${
                  isLastOddOnMobile ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <div className="shrink-0 text-[#0B0D0E]">
                  <Icon className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[12.5px] sm:text-[13.5px] text-[#0B0D0E] leading-tight truncate">
                    {item.title}
                  </span>
                  <span className="text-[11px] sm:text-[11.5px] text-[#6B7073] font-normal leading-tight mt-0.5 truncate">
                    {item.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
