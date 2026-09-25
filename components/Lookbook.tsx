"use client";

import { useRef } from "react";
import Image from "next/image";

const BASE = "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex";

const LOOKBOOK = [
  `${BASE}/lookbook/lookbook-1.jpg`,
  `${BASE}/lookbook/lookbook-2.jpg`,
  `${BASE}/lookbook/lookbook-3.jpg`,
  `${BASE}/lookbook/lookbook-4.jpg`,
  `${BASE}/lookbook/lookbook-5.jpg`,
  `${BASE}/lookbook/lookbook-6.jpg`,
];

export default function Lookbook() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-look]");
    const amount = (card?.offsetWidth ?? 360) + 16;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section id="lookbook" className="relative py-16 md:py-24 bg-cream border-t border-cream-line">
      <div className="max-w-wrap mx-auto px-5 md:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] md:text-xs font-bold tracking-[0.28em] uppercase text-gold">
              <span className="w-8 h-[2px] bg-gold" />
              The Archive
            </span>
            <h2 className="mt-3 font-display font-bold text-3xl md:text-5xl text-ink uppercase leading-[1.05]">
              Lookbook
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous lookbook slide"
              className="w-11 h-11 rounded-full border border-ink/30 text-ink flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next lookbook slide"
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
          {LOOKBOOK.map((src, i) => (
            <figure
              key={src}
              data-look
              className="snap-start shrink-0 w-[280px] md:w-[400px] group relative aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden bg-cream-deep border border-cream-line"
            >
              <Image
                src={src}
                alt={`RAWFLEX lookbook ${i + 1}`}
                fill
                sizes="(max-width: 768px) 280px, 400px"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080909]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <figcaption className="absolute bottom-4 left-4 text-[10px] font-bold tracking-[0.25em] uppercase text-ink opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Vol. 01 — Street
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}