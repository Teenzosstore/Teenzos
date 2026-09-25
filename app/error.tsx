"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F6] px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 text-center space-y-6 shadow-sm">
        <div className="w-14 h-14 bg-red-50 text-[#F72585] rounded-full flex items-center justify-center mx-auto border border-red-100">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#F72585]">
            Something went wrong
          </span>
          <h2
            className="font-display font-[350] text-2xl sm:text-3xl text-[#0B0D0E] uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Unexpected Glitch
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
            We encountered a temporary issue while loading this page. Please try refreshing or return to the main store.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[5px] bg-[#0B0D0E] hover:bg-[#F72585] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[5px] bg-white hover:bg-stone-50 text-[#0B0D0E] border border-stone-200 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
