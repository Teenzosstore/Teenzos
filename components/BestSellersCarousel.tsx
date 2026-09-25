"use client";

import { useRef } from "react";
import Link from "next/link";

interface BestSeller {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  image_url: string;
  rating?: number;
  review_count?: number;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function Stars({ rating = 4.9 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-gold" : "text-ink/25"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.04a1 1 0 0 0-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.04a1 1 0 0 0-1.18 0l-2.8 2.04c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69l1.07-3.29z" />
        </svg>
      ))}
    </div>
  );
}

function handleProductImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = "/image.png";
}

export default function BestSellersCarousel({
  products = [],
}: {
  products?: BestSeller[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const items = products.slice(0, 6);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = (card?.offsetWidth ?? 280) + 16;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section id="best-sellers" className="relative py-16 md:py-24 bg-cream border-t border-cream-line">
      <div className="max-w-wrap mx-auto px-5 md:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] md:text-xs font-bold tracking-[0.28em] uppercase text-gold">
              <span className="w-8 h-[2px] bg-gold" />
              Most Wanted
            </span>
            <h2 className="mt-3 font-display font-bold text-3xl md:text-5xl text-ink uppercase leading-[1.05]">
              Best Sellers
            </h2>
            <p className="mt-3 text-ink/60 font-body text-sm md:text-base">
              The pieces our community keeps coming back for.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous"
              className="w-11 h-11 rounded-full border border-ink/30 text-ink flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next"
              className="w-11 h-11 rounded-full border border-ink/30 text-ink flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div
          ref={trackRef}
          className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-5 md:px-8 max-w-wrap mx-auto w-full snap-x snap-mandatory"
        >
          {items.map((p) => {
            const price = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price;
            return (
              <Link
                key={p.id}
                href={`/shop/${p.id}`}
                data-card
                className="snap-start shrink-0 w-[220px] md:w-[260px] group block bg-panel rounded-2xl overflow-hidden border border-cream-line hover:border-gold/50 transition-colors"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-cream-deep">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    onError={handleProductImageError}
                    className="absolute inset-0 h-full w-full object-fill"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#080909]/70 backdrop-blur-sm border border-gold/40 text-gold text-[9px] font-bold uppercase tracking-wider">
                    Bestseller
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-ink text-[14px] leading-snug line-clamp-2 min-h-[2.4rem] group-hover:text-gold transition-colors">
                    {p.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-display font-bold text-gold text-[15px]">{formatINR(price)}</span>
                    {p.sale_price && p.sale_price < p.price && (
                      <span className="text-ink/40 text-xs line-through">{formatINR(p.price)}</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Stars rating={p.rating} />
                    <span className="text-[11px] font-semibold text-ink/50">
                      {p.rating ?? 4.9} ({p.review_count ?? 24})
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile arrows */}
      <div className="sm:hidden mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Previous"
          className="w-11 h-11 rounded-full border border-ink/30 text-ink flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Next"
          className="w-11 h-11 rounded-full border border-ink/30 text-ink flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
