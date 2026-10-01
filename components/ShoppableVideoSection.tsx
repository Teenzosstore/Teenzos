"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Instagram, Link2, Package, Volume2, VolumeX, Youtube } from "lucide-react";
import type { HomeShoppableVideo } from "@/lib/shoppableVideos";

// ── helpers ───────────────────────────────────────────────────────────────────

function detectPlatform(url: string): "instagram" | "youtube" | "other" {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  return "other";
}

// ── Uploaded video card ───────────────────────────────────────────────────────

function UploadedVideoCard({ item }: { item: HomeShoppableVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (!next) video.play().catch(() => {});
  };

  return (
    <div className="snap-center shrink-0 w-[calc(100vw-2rem)] max-w-[340px] sm:w-[300px] lg:w-[320px] flex flex-col gap-3">
      {/* Video */}
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-100 shadow-sm border border-neutral-200">
        <video
          ref={videoRef}
          src={item.video_url!}
          poster={item.poster_url || undefined}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
        />

        {item.title && (
          <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
            <p className="font-body text-sm font-semibold text-white leading-snug line-clamp-2">
              {item.title}
            </p>
          </div>
        )}

        {/* Sound toggle */}
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-ink flex items-center justify-center hover:bg-pink hover:text-white transition-colors shadow-sm"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      <ProductCard product={item.product} />
    </div>
  );
}

// ── External link card ────────────────────────────────────────────────────────

function ExternalLinkCard({ item }: { item: HomeShoppableVideo }) {
  const url = item.external_url!;
  const platform = detectPlatform(url);

  const cfg = {
    instagram: { bg: "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]", Icon: Instagram, label: "Watch on Instagram" },
    youtube:   { bg: "from-[#ff0000] to-[#cc0000]",                Icon: Youtube,   label: "Watch on YouTube"   },
    other:     { bg: "from-neutral-700 to-neutral-900",             Icon: Link2,     label: "Watch video"        },
  }[platform];

  return (
    <div className="snap-center shrink-0 w-[calc(100vw-2rem)] max-w-[340px] sm:w-[300px] lg:w-[320px] flex flex-col gap-3">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-sm border border-neutral-200 flex flex-col items-center justify-center gap-4 group"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.bg} opacity-90`} />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <cfg.Icon className="w-14 h-14 text-white drop-shadow-lg" />
          <span className="flex items-center gap-1.5 text-white text-sm font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors">
            {cfg.label} <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
        {item.title && (
          <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
            <p className="font-body text-sm font-semibold text-white leading-snug line-clamp-2">{item.title}</p>
          </div>
        )}
      </a>
      <ProductCard product={item.product} />
    </div>
  );
}

// ── Shared product card ───────────────────────────────────────────────────────

function ProductCard({ product }: { product: HomeShoppableVideo["product"] }) {
  return (
    <Link
      href={product.href}
      className="group flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-neutral-200 hover:border-pink hover:shadow-sm transition-all"
    >
      <div className="relative w-13 h-13 w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="48px" className="object-cover" />
        ) : (
          <Package className="w-5 h-5 text-neutral-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-body text-[13px] font-bold text-ink leading-snug line-clamp-2 group-hover:text-pink transition-colors">
          {product.name}
        </h3>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-body text-sm font-bold text-ink">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.oldPrice && (
            <span className="font-body text-xs text-neutral-400 line-through">
              ₹{product.oldPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-ink group-hover:bg-pink text-white text-[11px] font-bold px-3 py-1.5 transition-colors">
        View
      </span>
    </Link>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function ShoppableVideoSection({
  videos,
  title,
  subtitle,
  instagramUrl,
}: {
  videos: HomeShoppableVideo[];
  title?: string;
  subtitle?: string;
  instagramUrl?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [videos.length]);

  const scrollByCard = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(":scope > *");
    const amount = (card?.offsetWidth || 280) + 20;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section
      aria-label={title || "Shop from video"}
      className="bg-white py-12 sm:py-16 md:py-20 border-t border-neutral-100"
    >
      <div className="max-w-wrap mx-auto px-4 sm:px-6 md:px-8">

        {/* Heading */}
        {(title || subtitle) && (
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            {title && (
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-ink tracking-tight uppercase">
                {title}<span className="text-pink">.</span>
              </h2>
            )}
            {subtitle && (
              <p className="font-body text-sm sm:text-base text-neutral-500 mt-3">{subtitle}</p>
            )}
          </div>
        )}

        {/* Video scroll row — mobile: one card full-width centered + touch swipe; sm+: multi-card row + arrow buttons */}
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:[&>:first-child]:ml-auto sm:[&>:last-child]:mr-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollPaddingInline: '1rem' }}
          >
            {videos.map((item) =>
              item.external_url ? (
                <ExternalLinkCard key={item.id} item={item} />
              ) : (
                <UploadedVideoCard key={item.id} item={item} />
              )
            )}
          </div>

          {/* Prev/Next arrows — desktop/tablet only (mobile already has touch swipe) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByCard("left")}
              aria-label="Previous video"
              className="hidden sm:flex absolute left-0 top-[calc(50%-14px)] -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-md items-center justify-center text-ink hover:bg-ink hover:text-white hover:border-ink transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByCard("right")}
              aria-label="Next video"
              className="hidden sm:flex absolute right-0 top-[calc(50%-14px)] -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-md items-center justify-center text-ink hover:bg-ink hover:text-white hover:border-ink transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Instagram Follow button */}
        {instagramUrl && (
          <div className="flex justify-center mt-10">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full border border-neutral-200 bg-white hover:border-pink hover:shadow-md text-ink font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-100"
            >
              {/* Instagram gradient icon */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="url(#ig-light-grad)">
                <defs>
                  <linearGradient id="ig-light-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#f09433" />
                    <stop offset="25%"  stopColor="#e6683c" />
                    <stop offset="50%"  stopColor="#dc2743" />
                    <stop offset="75%"  stopColor="#cc2366" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span>Follow us on Instagram</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
