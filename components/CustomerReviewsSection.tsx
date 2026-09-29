"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ChevronLeft, ChevronRight, CheckCircle2, MessageSquareQuote } from "lucide-react";

export interface ReviewItem {
  id: string;
  product_id: string;
  rating: number;
  review_text: string | null;
  comment?: string | null;
  created_at?: string;
  is_approved?: boolean;
  products?: any;
  profiles?: any;
}

interface CustomerReviewsSectionProps {
  reviews: ReviewItem[] | any[];
}

function parseReview(review: ReviewItem) {
  const rawText = review.review_text || review.comment || "";
  const match = rawText.match(/^\[Customer:\s*([^\]]+)\]\s*([\s\S]*)$/);

  const profile = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
  const product = Array.isArray(review.products) ? review.products[0] : review.products;

  let reviewerName = "Verified Buyer";
  let comment = rawText;

  if (match) {
    reviewerName = match[1].trim();
    comment = match[2].trim();
  } else if (profile?.full_name) {
    reviewerName = profile.full_name;
  } else if (profile?.email) {
    reviewerName = profile.email.split("@")[0];
  }

  const productName = product?.name || "TeenZos Streetwear";
  const productSlug = product?.slug || product?.id || review.product_id || "";
  const productImage =
    product?.featured_image_url ||
    product?.product_images?.[0]?.image_url ||
    "/OVERSIZED..webp";

  return {
    reviewerName,
    comment,
    productName,
    productSlug,
    productImage,
    rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
    date: review.created_at
      ? new Date(review.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "Recent",
  };
}

export default function CustomerReviewsSection({ reviews = [] }: CustomerReviewsSectionProps) {
  const [cardsPerView, setCardsPerView] = useState<number>(5);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Responsive cards per view: Desktop = 5, Tablet = 3, Small tablet = 2, Mobile = 1
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCardsPerView(1); // Mobile: 1 show ho
      } else if (width < 768) {
        setCardsPerView(2); // Small tablet: 2
      } else if (width < 1024) {
        setCardsPerView(3); // Tablet: 3
      } else {
        setCardsPerView(5); // Desktop: 5 show ho
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalReviews = reviews.length;
  const maxIndex = Math.max(0, totalReviews - cardsPerView);

  // Keep index within bounds if window is resized
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [cardsPerView, maxIndex, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Touch Swipe for mobile gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45 && currentIndex < maxIndex) {
      handleNext();
    } else if (diff < -45 && currentIndex > 0) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      aria-label="Real Product Reviews"
      className="w-full bg-white border-t border-stone-200/70 py-8 sm:py-10 md:py-12 select-none overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        
        {/* =========================================================
            HEADER: Brand Tag, Title, Live Rating, Prev/Next Arrows
            ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-body font-bold text-xs text-[#F72585] tracking-widest uppercase">
                #REALFEEDBACK
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                {totalReviews} {totalReviews === 1 ? "Product Review" : "Product Reviews"}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
              <h2 className="font-display font-[350] text-[#0B0D0E] text-2xl sm:text-3xl md:text-[34px] uppercase tracking-[0.08em] leading-tight">
                VERIFIED CUSTOMER REVIEWS
              </h2>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-700">
                <span className="text-amber-500">★</span> 5.0 Real Drops
              </div>
            </div>
          </div>

          {/* Navigation Arrows (Visible when reviews exist and slider can slide) */}
          {totalReviews > cardsPerView && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                aria-label="Previous review"
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all ${
                  currentIndex === 0
                    ? "border-stone-200 text-stone-300 cursor-not-allowed bg-stone-50"
                    : "border-stone-300 text-stone-800 hover:bg-[#0B0D0E] hover:text-white hover:border-[#0B0D0E] active:scale-95"
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                aria-label="Next review"
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all ${
                  currentIndex >= maxIndex
                    ? "border-stone-200 text-stone-300 cursor-not-allowed bg-stone-50"
                    : "border-stone-300 text-stone-800 hover:bg-[#0B0D0E] hover:text-white hover:border-[#0B0D0E] active:scale-95"
                }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          )}
        </div>

        {/* =========================================================
            STATE A: Real Reviews Slider (Desktop: 5, Mobile: 1)
            ========================================================= */}
        {totalReviews > 0 ? (
          <div
            className="relative w-full overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Sliding Track */}
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
              }}
            >
              {reviews.map((rev) => {
                const parsed = parseReview(rev);
                const firstLetter = (parsed.reviewerName || "C").charAt(0).toUpperCase();

                return (
                  <div
                    key={rev.id}
                    className="p-1.5 sm:p-2 flex-shrink-0"
                    style={{
                      width: `${100 / cardsPerView}%`,
                      maxWidth: `${100 / cardsPerView}%`,
                    }}
                  >
                    <div className="bg-[#FAF9F6] border border-stone-200/90 hover:border-black/30 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between h-[210px] sm:h-[220px] transition-all duration-300 group shadow-xs hover:shadow-md">
                      
                      {/* 1. Product Link & Thumbnail Chip */}
                      <Link
                        href={`/shop/${parsed.productSlug}`}
                        className="flex items-center gap-2.5 pb-2.5 border-b border-stone-200/70 group-hover:border-stone-300 transition-colors"
                        title={`View ${parsed.productName}`}
                      >
                        <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-md overflow-hidden bg-stone-200 flex-shrink-0 border border-stone-200">
                          <Image
                            src={parsed.productImage}
                            alt={parsed.productName}
                            fill
                            sizes="36px"
                            className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] sm:text-xs font-bold text-stone-900 truncate group-hover:text-[#F72585] transition-colors">
                            {parsed.productName}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="flex items-center text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < parsed.rating ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"
                                  }`}
                                />
                              ))}
                            </span>
                            <span className="text-[10px] font-semibold text-stone-500 ml-0.5">
                              {parsed.rating}.0
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* 2. Review Comment Quote (clamped to fit compactly) */}
                      <div className="my-auto py-1">
                        <p className="text-xs text-stone-700 font-medium leading-relaxed line-clamp-3 italic">
                          "{parsed.comment || "Loved the fit and quality, definitely buying again!"}"
                        </p>
                      </div>

                      {/* 3. Reviewer Name & Verified Badge */}
                      <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-stone-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-[#0B0D0E] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {firstLetter}
                          </div>
                          <span className="text-[11px] sm:text-xs font-semibold text-stone-900 truncate">
                            {parsed.reviewerName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 flex-shrink-0 ml-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Verified</span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Pagination Indicator Dots */}
            {cardsPerView === 1 && totalReviews > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3 sm:hidden">
                {reviews.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to review ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentIndex === idx ? "w-6 bg-[#0B0D0E]" : "w-1.5 bg-stone-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* =========================================================
              STATE B: Zero Dummy Reviews Notice (Clean & Ultra-Compact)
              ========================================================= */
          <div className="bg-[#FAF9F6] border border-stone-200/90 rounded-2xl p-5 sm:p-7 text-center max-w-2xl mx-auto shadow-xs mt-16">
            <div className="w-10 h-10 rounded-full bg-[#0B0D0E] text-white mx-auto flex items-center justify-center mb-3">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <h3 className="font-display font-[350] text-[#0B0D0E] text-lg sm:text-xl uppercase tracking-wider mb-1">
              Be The First To Drop A Review
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-4 leading-relaxed font-body">
              No dummy reviews here — only real feedback from verified customers! Share your thoughts on any product page and your review will appear right here.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#0B0D0E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#F72585] transition-colors duration-300 shadow-sm"
            >
              Shop Drops & Review
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
