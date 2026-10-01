"use client";

import React, { useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Zap,
  Crown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ==========================================
// BADGE CONFIGURATIONS (Only for New Arrivals, Hot Bestseller, Trending, Exclusive)
// ==========================================

interface BadgeConfig {
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  defaultSubtitle: string;
  defaultImage: string;
}

const FEATURED_CONFIGS: Record<string, BadgeConfig> = {
  "new-arrivals": {
    tag: "NEW DROP",
    icon: Sparkles,
    badgeBg: "bg-[#FFE1ED]/95 text-[#F72585] border-[#F72585]/30",
    defaultSubtitle: "Fresh drops. Fresh energy.",
    defaultImage: "/images/explore/img_04.png",
  },
  bestseller: {
    tag: "BESTSELLER",
    icon: Flame,
    badgeBg: "bg-[#FFF0E3]/95 text-[#F47B20] border-[#F47B20]/30",
    defaultSubtitle: "The pieces everyone's repping.",
    defaultImage: "/images/explore/img_01.png",
  },
  trending: {
    tag: "ON FIRE",
    icon: Zap,
    badgeBg: "bg-[#DDF6F8]/95 text-[#0891B2] border-[#36B8C5]/30",
    defaultSubtitle: "Viral fits setting the wave.",
    defaultImage: "/images/explore/img_02.png",
  },
  exclusive: {
    tag: "1-OF-1 DROP",
    icon: Crown,
    badgeBg: "bg-[#F3E8FF]/95 text-[#9333EA] border-[#9333EA]/30",
    defaultSubtitle: "Numbered runs. Never restocked.",
    defaultImage: "/images/explore/img_03.png",
  },
};

// Fallback images for apparel categories if image_url is missing
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  hoodies: "/images/explore/img_01.png",
  "t-shirts": "/images/explore/img_02.png",
  sweatshirts: "/images/explore/img_03.png",
  jackets: "/images/explore/img_04.png",
  bottoms: "/images/explore/img_02.png",
  accessories: "/images/explore/img_03.png",
  men: "/images/explore/img_01.png",
  women: "/images/explore/img_04.png",
};

function matchFeaturedKey(id: string = "", slug: string = "", name: string = ""): string | null {
  const norm = `${id} ${slug} ${name}`.toLowerCase();
  if (norm.includes("new-arrival") || norm.includes("new arrival") || norm.includes("new-drop") || norm.includes("new drop")) {
    return "new-arrivals";
  }
  if (norm.includes("bestseller") || norm.includes("best-seller") || norm.includes("best seller")) {
    return "bestseller";
  }
  if (norm.includes("trending") || norm.includes("trend")) {
    return "trending";
  }
  if (norm.includes("exclusive")) {
    return "exclusive";
  }
  return null;
}

export interface CategoryData {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  count?: string;
  is_active?: boolean;
}

interface CategoriesProps {
  categories?: CategoryData[];
}

export default function Categories({ categories = [] }: CategoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Group: Featured collections first (with badges if in DB), then all remaining admin categories
  const allCollections = useMemo(() => {
    const list = Array.isArray(categories) ? [...categories] : [];

    // Filter out any inactive categories immediately
    const activeList = list.filter((cat) => cat.is_active !== false);

    const featuredOrder = ["new-arrivals", "bestseller", "trending", "exclusive"];
    const featuredMap = new Map<string, CategoryData>();
    const otherCategories: CategoryData[] = [];

    activeList.forEach((cat) => {
      const key = matchFeaturedKey(cat.id, cat.slug, cat.name);
      if (key) {
        if (!featuredMap.has(key)) {
          featuredMap.set(key, cat);
        }
      } else {
        otherCategories.push(cat);
      }
    });

    // 1. Featured collections (WITH BADGES) — ONLY IF THEY EXIST IN DB!
    const orderedFeatured: any[] = [];
    featuredOrder.forEach((key) => {
      const existing = featuredMap.get(key);
      if (!existing) return; // Do NOT render if deleted by admin!

      const config = FEATURED_CONFIGS[key];
      const title =
        key === "new-arrivals"
          ? "NEW ARRIVALS"
          : key === "bestseller"
          ? "HOT BESTSELLER"
          : key === "trending"
          ? "TRENDING"
          : "EXCLUSIVE";

      orderedFeatured.push({
        id: existing.id,
        slug: existing.slug || existing.id,
        title: (existing.name || title).toUpperCase(),
        subtitle: existing.count || existing.description || config?.defaultSubtitle || "Explore Collection",
        image: existing.image_url || config?.defaultImage || "/images/explore/img_01.png",
        link: `/shop?category=${existing.slug || existing.id}`,
        alt: `TeenZos ${existing.name || title} Collection`,
        badge: config
          ? {
              tag: config.tag,
              icon: config.icon,
              badgeBg: config.badgeBg,
            }
          : null,
      });
    });

    // 2. All other admin categories (WITHOUT BADGES) — ONLY IF THEY EXIST IN DB!
    const mappedOthers = otherCategories.map((cat) => {
      const slug = cat.slug || cat.id;
      const fallbackImg =
        CATEGORY_FALLBACK_IMAGES[slug.toLowerCase()] ||
        CATEGORY_FALLBACK_IMAGES[cat.id.toLowerCase()] ||
        "/images/explore/img_01.png";

      return {
        id: cat.id,
        slug,
        title: (cat.name || slug).toUpperCase(),
        subtitle: cat.count || cat.description || "Explore Collection",
        image: cat.image_url || fallbackImg,
        link: `/shop?category=${slug}`,
        alt: `TeenZos ${cat.name || slug} Collection`,
        badge: null, // NO badge for other categories
      };
    });

    return [...orderedFeatured, ...mappedOthers];
  }, [categories]);

  // Chunk collections into slides of 4:
  // Desktop: 1 row of 4 columns (lg:grid-cols-4)
  // Mobile: 2 rows of 2 columns (grid-cols-2)
  const slides = useMemo(() => {
    const chunks: (typeof allCollections)[] = [];
    for (let i = 0; i < allCollections.length; i += 4) {
      chunks.push(allCollections.slice(i, i + 4));
    }
    return chunks;
  }, [allCollections]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (allCollections.length === 0) {
    return null;
  }

  return (
    <section
      id="categories"
      aria-label="Shop By Collection"
      className="w-full bg-[#F7F7F5] py-8 sm:py-12 md:py-14 lg:py-16 overflow-hidden select-none"
    >
      <div className="max-w-[1380px] mx-auto px-3 sm:px-6 md:px-8 lg:px-10">
        
        {/* ── Section Header ── */}
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8 md:mb-10">
          <div className="flex flex-col">
            <span className="font-body font-medium text-[11px] sm:text-xs md:text-[13px] text-[#6B7073] tracking-[0.24em] uppercase mb-2 ml-1">
              EXPLORE
            </span>
            <h2 className="font-display font-[350] text-[#0B0D0E] text-2xl sm:text-3xl md:text-4xl lg:text-[42px] tracking-tight uppercase leading-none">
              SHOP BY COLLECTION
            </h2>
          </div>

          <Link
            href="/shop"
            prefetch={true}
            className="group font-body font-bold text-xs sm:text-sm text-[#0B0D0E] hover:text-[#F72585] inline-flex items-center gap-1.5 transition-colors shrink-0 pb-1"
          >
            <span>View All</span>
          </Link>
        </div>

        {/* ── Carousel Wrapper with Left & Right Buttons ── */}
        <div className="relative group/carousel px-2 xs:px-3 sm:px-0">

          {/* Left Arrow Button */}
          {slides.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous categories"
              className="absolute left-0 sm:-left-4 md:-left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#0B0D0E] hover:text-[#F72585] shadow-[0_4px_16px_rgba(0,0,0,0.28)] border border-black/15 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer pointer-events-auto touch-manipulation select-none"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
          )}

          {/* Right Arrow Button */}
          {slides.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next categories"
              className="absolute right-0 sm:-right-4 md:-right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#0B0D0E] hover:text-[#F72585] shadow-[0_4px_16px_rgba(0,0,0,0.28)] border border-black/15 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer pointer-events-auto touch-manipulation select-none"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
          )}

          {/* Carousel Track Container */}
          <div
            className="overflow-hidden w-full rounded-[10px] sm:rounded-[14px]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-500 ease-out will-change-transform"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map((slideItems, slideIdx) => (
                <div
                  key={slideIdx}
                  className="w-full shrink-0"
                >
                  {/* Desktop: 1 row with 4 categories (lg:grid-cols-4)
                      Mobile: 2 rows with 2 categories each (grid-cols-2) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                    {slideItems.map((col, index) => {
                      const Icon = col.badge?.icon;
                      return (
                        <Link
                          key={col.id}
                          href={col.link}
                          prefetch={true}
                          className="group relative block aspect-[4/5] sm:aspect-[4.5/5] rounded-[10px] sm:rounded-[14px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-stone-900 border border-black/5 hover:border-black/15"
                        >
                          {/* Card Image */}
                          <Image
                            src={col.image}
                            alt={col.alt}
                            fill
                            priority={slideIdx === 0 && index < 4}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                          />

                          {/* Gradient Scrim for Legibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15 transition-opacity duration-300 group-hover:opacity-95" />

                          {/* Top Badge Tag - ONLY rendered for the 4 featured collections */}
                          {col.badge && Icon && (
                            <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-10">
                              <span
                                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold tracking-wider uppercase border backdrop-blur-md shadow-xs ${col.badge.badgeBg}`}
                              >
                                <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                                <span>{col.badge.tag}</span>
                              </span>
                            </div>
                          )}

                          {/* Card Bottom Meta */}
                          <div className="absolute inset-x-0 bottom-0 p-2.5 xs:p-3 sm:p-4 md:p-5 flex items-end justify-between gap-2 sm:gap-3 z-10">
                            <div className="flex flex-col min-w-0 pr-1 sm:pr-2">
                              <h3 className="font-display font-[350] text-white text-[13px] xs:text-sm sm:text-base md:text-lg lg:text-[21px] uppercase tracking-[0.020em] leading-tight drop-shadow-sm group-hover:text-[#36B8C5] transition-colors duration-200 truncate">
                                {col.title}
                              </h3>
                              {col.subtitle && (
                                <p className="text-white/85 text-[10px] xs:text-[11px] sm:text-xs md:text-[13px] font-medium leading-snug mt-0.5 truncate">
                                  {col.subtitle}
                                </p>
                              )}
                            </div>

                            {/* Circular Action Arrow Button */}
                            <div
                              className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/90 sm:bg-white text-[#0B0D0E] group-hover:bg-[#F72585] group-hover:text-white flex items-center justify-center shrink-0 shadow-md transform group-hover:scale-110 transition-all duration-300"
                              aria-hidden="true"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5 sm:mt-6">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? "w-6 sm:w-8 bg-[#0B0D0E]"
                      : "w-2 bg-[#0B0D0E]/20 hover:bg-[#0B0D0E]/40"
                  }`}
                />
              ))}
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
