"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Phone, ChevronUp } from "lucide-react";
import { SITE } from "@/lib/data";

export default function FloatingActionButtons() {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Hide on admin portal
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <aside
      aria-label="Quick Actions"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[9980] flex flex-col items-center gap-2.5 sm:gap-3 select-none pointer-events-none"
    >
      {/* ── Scroll To Top Button (Hidden until scrolled down) ── */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-white text-[#0B0D0E] shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-110 active:scale-95 border border-stone-200 hover:border-[#0B0D0E] hover:text-[#F72585] cursor-pointer pointer-events-auto ${
          showScrollTop
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-75 !pointer-events-none"
        }`}
      >
        <ChevronUp className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* ── Call Button ── */}
      <a
        href={`tel:${SITE.phoneHref}`}
        aria-label="Call store"
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-[#0B0D0E] text-white shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10 hover:border-[#F72585] hover:text-[#F72585] group pointer-events-auto"
      >
        <Phone className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
      </a>

      {/* ── WhatsApp Button ── */}
      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
          SITE.whatsappMessage || "Hi TeenZos! I'd like to know more about your collection."
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95 bg-transparent drop-shadow-[0_4px_16px_rgba(39,180,62,0.4)] pointer-events-auto"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 31C23.732 31 30 24.732 30 17C30 9.26801 23.732 3 16 3C8.26801 3 2 9.26801 2 17C2 19.5109 2.661 21.8674 3.81847 23.905L2 31L9.31486 29.3038C11.3014 30.3854 13.5789 31 16 31ZM16 28.8462C22.5425 28.8462 27.8462 23.5425 27.8462 17C27.8462 10.4576 22.5425 5.15385 16 5.15385C9.45755 5.15385 4.15385 10.4576 4.15385 17C4.15385 19.5261 4.9445 21.8675 6.29184 23.7902L5.23077 27.7692L9.27993 26.7569C11.1894 28.0746 13.5046 28.8462 16 28.8462Z"
            fill="#BFC8D0"
          />
          <path
            d="M28 16C28 22.6274 22.6274 28 16 28C13.4722 28 11.1269 27.2184 9.19266 25.8837L5.09091 26.9091L6.16576 22.8784C4.80092 20.9307 4 18.5589 4 16C4 9.37258 9.37258 4 16 4C22.6274 4 28 9.37258 28 16Z"
            fill="url(#paint0_linear_87_7264)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 30C23.732 30 30 23.732 30 16C30 8.26801 23.732 2 16 2C8.26801 2 2 8.26801 2 16C2 18.5109 2.661 20.8674 3.81847 22.905L2 30L9.31486 28.3038C11.3014 29.3854 13.5789 30 16 30ZM16 27.8462C22.5425 27.8462 27.8462 22.5425 27.8462 16C27.8462 9.45755 22.5425 4.15385 16 4.15385C9.45755 4.15385 4.15385 9.45755 4.15385 16C4.15385 18.5261 4.9445 20.8675 6.29184 22.7902L5.23077 26.7692L9.27993 25.7569C11.1894 27.0746 13.5046 27.8462 16 27.8462Z"
            fill="white"
          />
          <path
            d="M12.5 9.49989C12.1672 8.83131 11.6565 8.8905 11.1407 8.8905C10.2188 8.8905 8.78125 9.99478 8.78125 12.05C8.78125 13.7343 9.52345 15.578 12.0244 18.3361C14.438 20.9979 17.6094 22.3748 20.2422 22.3279C22.875 22.2811 23.4167 20.0154 23.4167 19.2503C23.4167 18.9112 23.2062 18.742 23.0613 18.696C22.1641 18.2654 20.5093 17.4631 20.1328 17.3124C19.7563 17.1617 19.5597 17.3656 19.4375 17.4765C19.0961 17.8018 18.4193 18.7608 18.1875 18.9765C17.9558 19.1922 17.6103 19.083 17.4665 19.0015C16.9374 18.7892 15.5029 18.1511 14.3595 17.0426C12.9453 15.6718 12.8623 15.2001 12.5959 14.7803C12.3828 14.4444 12.5392 14.2384 12.6172 14.1483C12.9219 13.7968 13.3426 13.254 13.5313 12.9843C13.7199 12.7145 13.5702 12.305 13.4803 12.05C13.0938 10.953 12.7663 10.0347 12.5 9.49989Z"
            fill="white"
          />
          <defs>
            <linearGradient
              id="paint0_linear_87_7264"
              x1="26.5"
              y1="7"
              x2="4"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#5BD066" />
              <stop offset="1" stopColor="#27B43E" />
            </linearGradient>
          </defs>
        </svg>
      </a>
    </aside>
  );
}
