import React from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import { SITE } from "@/lib/data";
import { Sparkles, ShieldCheck, Flame, Truck, ArrowRight, MapPin, User, Phone, CheckCircle2, BadgeCheck } from "lucide-react";

export const metadata = {
  title: "About Us | Teenzosstore",
  description:
    "Learn about Teenzosstore — premium streetwear crafted in Ahmedabad, built for the bold and made for the new generation.",
};

const PILLARS = [
  {
    id:1,
    icon: Flame,
    title: "240+ GSM Heavyweight",
    description: "Ultra-durable combed cotton that holds its structure wash after wash without sagging.",
    tag: "FABRIC",
    borderColor: "#F72585",
  },
  {
    id:2,
    icon: Sparkles,
    title: "Signature Oversized Fits",
    description: "Custom drop shoulders and boxy silhouettes tailored for the authentic street drape.",
    tag: "SILHOUETTE",
    borderColor: "#308CE8",
  },
  {
    id:3,
    icon: ShieldCheck,
    title: "Cyber & Urban Art",
    description: "High-density, fade-proof graphic artworks designed exclusively for our crew.",
    tag: "AESTHETIC",
    borderColor: "#9B5DE5",
  },
  {
    id:4,
    icon: Truck,
    title: "Pan-India Express",
    description: "Fast tracked dispatch straight from our Ahmedabad hub to every corner of India.",
    tag: "DELIVERY",
    borderColor: "#27B43E",
  },
];

const STATS = [
  { value: "10K+", label: "Flexers Styled" },
  { value: "240+", label: "GSM Cotton" },
  { value: "28+", label: "States Shipped" },
  { value: "4.9 ★", label: "Average Rating" },
];

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F7F7F6] pt-[104px] md:pt-[116px]">
        {/* ── Streetwear Graffiti Hero Banner (Shop Header Style) ── */}
        <PageHeroBanner title="ABOUT US" subtitle="THE TEENZOS STORY" />

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
          {/* ── Section 1: Brand Story & Studio Badge (Compact 2-col) ── */}
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE1ED] border border-[#F72585]/20 text-[#F72585] text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F72585] animate-pulse" />
                #WearYourVibe
              </div>

              <h2 className="font-display font-[350] text-2xl sm:text-4xl md:text-5xl text-[#0B0D0E] tracking-tight uppercase leading-[1.08] ">
                BORN FOR THE BOLD. <br />
                <span className="text-[#F72585] pt-2 inline-block">MADE FOR THE STREETS.</span>
              </h2>

              <p className="text-stone-600 text-sm sm:text-[15px] leading-relaxed max-w-xl">
                <strong className="text-[#0B0D0E]">Teenzosstore</strong> was founded with a single obsession: creating streetwear that feels as good as it looks. We reject flimsy fast fashion. Instead, we engineer heavyweight fabrics with bold cyber and urban graphics that empower you to express your authentic vibe.
              </p>

              <p className="text-stone-600 text-sm sm:text-[15px] leading-relaxed max-w-xl">
                Every drop is conceptualized, sampled, and packed with care in Ahmedabad. From drop-shoulder cuts to distressed finishes, each piece is built to survive the daily grind while staying iconic.
              </p>

              {/* Official Proprietor & Store Credential Card (Compact) */}
              <div className="bg-white rounded-[5px] p-4 sm:p-5 border border-stone-300/90 shadow-xs max-w-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0B0D0E] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F72585]" /> Official Store Details
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#27B43E] bg-[#E9F9EE] px-2.5 py-0.5 rounded-full border border-[#27B43E]/20">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#27B43E]" />
                    Verified Brand
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-[13px]">
                  {/* Proprietor */}
                  <div className="flex items-center gap-2.5 text-stone-600 bg-stone-50/70 p-2.5 rounded-lg border border-stone-200/60">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFE1ED] text-[#F72585] flex items-center justify-center shrink-0 shadow-2xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Proprietor</span>
                      <strong className="text-[#0B0D0E] block truncate">{SITE.proprietor}</strong>
                    </div>
                  </div>

                  {/* Direct Contact */}
                  <div className="flex items-center gap-2.5 text-stone-600 bg-stone-50/70 p-2.5 rounded-lg border border-stone-200/60">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E0F7FA] text-[#0097A7] flex items-center justify-center shrink-0 shadow-2xs">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Direct Contact</span>
                      <a href={`tel:${SITE.phoneHref}`} className="text-[#0B0D0E] font-semibold hover:text-[#F72585] transition-colors block truncate">
                        {SITE.phone}
                      </a>
                    </div>
                  </div>

                  {/* Store & Hub (Full Width) */}
                  <div className="sm:col-span-2 flex items-start gap-2.5 text-stone-600 bg-stone-50/70 p-2.5 rounded-lg border border-stone-200/60">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFE1ED] text-[#F72585] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Store & Hub</span>
                      <span className="text-[#0B0D0E] font-medium leading-relaxed block">{SITE.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] sm:aspect-[1/1] lg:aspect-[4.5/5] rounded-[5px] overflow-hidden shadow-xl border border-stone-200 bg-white group">
                <Image
                  src="/images/same_energy.png"
                  alt="Teenzos Streetwear Collection"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Floating Chips */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
                  🔥 Streetwear Edition
                </div>

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-[#F72585] font-extrabold text-xs tracking-widest uppercase">
                    Authentic Fit
                  </span>
                  <h3 className="font-display font-[350] text-2xl uppercase mt-0.5">
                    Wear Your Confidence
                  </h3>
                  <p className="text-white/80 text-xs mt-1">
                    Tailored for comfort. Built for the culture.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Core Pillars (Compact 4 Cards Grid) ── */}
          <div className="space-y-4 lg:py-6">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#F72585]">
                Why Teenzos
              </span>
              <h3 className="font-display font-[350] text-2xl sm:text-3xl text-[#0B0D0E] uppercase mt-1">
                The Anatomy of Our Drops
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                <div key={pillar.id} className="bg-white rounded-[5px] p-5 border shadow-xs hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group" style={{ borderColor: pillar.borderColor }}
>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0B0D0E] text-white flex items-center justify-center group-hover:bg-[#F72585] transition-colors">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 bg-stone-100 px-2.5 py-1 rounded-md">
                          {pillar.tag}
                        </span>
                      </div>
                      <h4 className="font-display font-[350] text-lg text-[#0B0D0E] uppercase mb-1.5">
                        {pillar.title}
                      </h4>
                      <p className="text-stone-500 text-xs leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 3: Live Stats Strip (Compact & Crisp) ── */}
          <div className="bg-[#0B0D0E] rounded-[5px] p-6 sm:p-8 text-white relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F72585]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {STATS.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="font-display font-[350] text-3xl sm:text-4xl text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 4: Compact CTA Strip ── */}
          <div className="bg-gradient-to-r from-stone-900 via-[#0B0D0E] to-stone-900 rounded-[5px] p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-stone-800 shadow-md">
            <div>
              <h3 className="font-display font-[350] text-xl sm:text-2xl uppercase tracking-wide">
                Ready to Upgrade Your Fit?
              </h3>
              <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
                Explore our latest streetwear drops, hoodies, and oversized tees.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[5px] bg-[#F72585] hover:bg-[#d8196f] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 shrink-0"
            >
              <span>Shop Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
