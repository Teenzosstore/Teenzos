"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
  FaPinterestP,
  FaXTwitter,
} from "react-icons/fa6";

// ==========================================
// NAVIGATION DATA MATCHING REFERENCE IMAGE
// ==========================================

const SHOP_LINKS = [
  { label: "New Arrivals", href: "/shop?category=new-arrivals" },
  { label: "Hot Bestseller", href: "/shop?category=bestseller" },
  { label: "Trending", href: "/shop?category=trending" },
  { label: "Exclusive", href: "/shop?category=exclusive" },
  { label: "Men", href: "/shop?category=men" },
  { label: "Women", href: "/shop?category=women" },
];

const HELP_LINKS = [
  { label: "Contact Us", href: "/contact" },
  {
    label: "Track Order",
    href: "/orders/track",
  },
  { label: "Shipping", href: "/policies/shipping" },
  { label: "Returns", href: "/policies/refund" },
  { label: "FAQ", href: "/faq" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
];

export default function Footer() {
  return (
    <footer
      aria-label="Site Footer"
      className="w-full bg-[#0B0D0E] text-white pt-14 pb-24 sm:pb-24 lg:pb-10 border-t border-white/5 select-none"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        {/* =========================================================
            TOP GRID: 5 COLUMNS (BRAND, SHOP, HELP, COMPANY, CONTACT)
            ========================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.6fr] gap-8 sm:gap-10 lg:gap-8 pb-12 sm:pb-14">
          {/* ── COLUMN 1: BRAND LOGO, TAGLINE & SOCIALS ── */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col items-start">
            <Link
              href="/"
              className="inline-flex items-center gap-3 group mb-5 sm:mb-6"
              aria-label="TeenZos Store Home"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                <Image
                  src="/TeenZos_Logo.png"
                  alt="TeenZos Bunny Mascot"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-200"
                  unoptimized
                />
              </div>
              <div className="flex flex-col justify-center leading-tight">
                <span
                  className="font-display font-[350] text-xl sm:text-2xl text-white tracking-tight group-hover:text-[#F72585] transition-colors"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Teenzosstore
                </span>
                <span className="font-body text-[#9CA3AF] text-xs sm:text-[13px] tracking-tighter uppercase mt-1 font-normal">
                  Wear your vibe.
                </span>
              </div>
            </Link>

            {/* Social Icons Row (Clean, crisp, 100% visible and responsive) */}
            <div className="flex items-center gap-2.5 sm:gap-3 lg:mt-6 mt-4">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/teenzos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F72585]/40 hover:bg-[#F72585]/10 hover:text-[#F72585] hover:shadow-[0_8px_25px_rgba(247,37,133,0.18)]"
              >
                <FaInstagram className="h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-110" />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/917862907344?text=Hi%20TeenZos!"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#25D366]/40 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:shadow-[0_8px_25px_rgba(37,211,102,0.18)]"
              >
                <FaWhatsapp className="h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-110" />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@teenzos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FF0000]/40 hover:bg-[#FF0000]/10 hover:text-[#FF0000] hover:shadow-[0_8px_25px_rgba(255,0,0,0.18)]"
              >
                <FaYoutube className="h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-110" />
              </a>

              {/* Pinterest */}
              <a
                href="https://pinterest.com/teenzos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#E60023]/40 hover:bg-[#E60023]/10 hover:text-[#E60023] hover:shadow-[0_8px_25px_rgba(230,0,35,0.18)]"
              >
                <FaPinterestP className="h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-110" />
              </a>

              {/* X */}
              <a
                href="https://twitter.com/teenzos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-[0_8px_25px_rgba(255,255,255,0.12)]"
              >
                <FaXTwitter className="h-[16px] w-[16px] transition-transform duration-300 group-hover:scale-110" />
              </a>
            </div>
          </div>

          {/* ── COLUMN 2: SHOP ── */}
          <div className="flex flex-col">
            <h3 className="font-body font-bold text-xs sm:text-[13px] uppercase tracking-wider text-white mb-3.5 sm:mb-4">
              SHOP
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-xs sm:text-[13px] text-[#A0A6AC] hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── COLUMN 3: HELP ── */}
          <div className="flex flex-col">
            <h3 className="font-body font-bold text-xs sm:text-[13px] uppercase tracking-wider text-white mb-3.5 sm:mb-4">
              HELP
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-xs sm:text-[13px] text-[#A0A6AC] hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── COLUMN 4: COMPANY ── */}
          <div className="flex flex-col">
            <h3 className="font-body font-bold text-xs sm:text-[13px] uppercase tracking-wider text-white mb-3.5 sm:mb-4">
              COMPANY
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-xs sm:text-[13px] text-[#A0A6AC] hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── COLUMN 5: CONTACT ── */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col">
            <h3 className="font-body font-bold text-xs sm:text-[13px] uppercase tracking-wider text-white mb-3.5 sm:mb-4">
              CONTACT
            </h3>
            <ul className="space-y-3 sm:space-y-3.5 text-xs sm:text-[13px]">
              {/* Email */}
              <li className="flex items-center gap-2.5 text-[#A0A6AC]">
                <svg
                  className="w-4 h-4 text-white shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <a
                  href="mailto:teenzosstore@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  teenzosstore@gmail.com
                </a>
              </li>

              {/* Phone */}
              <li className="flex items-center gap-2.5 text-[#A0A6AC]">
                <svg
                  className="w-4 h-4 text-white shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <a
                  href="tel:+917862907344"
                  className="hover:text-white transition-colors"
                >
                  +91 78629 07344
                </a>
              </li>

              {/* Secondary Phone / Proprietor Contact */}
              <li className="flex items-center gap-2.5 text-[#A0A6AC]">
                <svg
                  className="w-4 h-4 text-white shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <a
                  href="tel:+917622078703"
                  className="hover:text-white transition-colors"
                >
                  +91 76220 78703
                </a>
              </li>

              {/* Address */}
              <li className="flex items-start gap-2.5 text-[#A0A6AC]">
                <svg
                  className="w-4 h-4 text-white shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="leading-relaxed">
                  First Floor B/123, Sohelpark,
                  <br />
                  Fatehwadi, Gyaspur, Ahmedabad – 382405
                </span>
              </li>

              {/* Proprietor */}
              <li className="text-[#A0A6AC] text-[12px] pt-[8px] border-t border-white/10">
                <span className="text-white/60">Proprietor:</span>{" "}
                <span className="text-white font-medium">Nabil Patni Vahora</span>
              </li>
            </ul>
          </div>
        </div>

        {/* =========================================================
            BOTTOM SUB-FOOTER: COPYRIGHT & BRAND SIGN-OFF
            ========================================================= */}
        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#9CA3AF]">
          <p>© {new Date().getFullYear()} Teenzosstore. All rights reserved.</p>
          <p className="flex items-center gap-1.5 justify-center">
            <span>Made with</span>
            <span className="text-[#F72585] text-sm animate-pulse">💖</span>
            <span>for the new generation.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
