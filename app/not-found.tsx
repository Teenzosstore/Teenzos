import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | Teenzosstore",
  description: "The page you're looking for doesn't exist or has moved. Explore the latest streetwear collection at Teenzosstore.",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[75vh] flex items-center justify-center bg-[#F7F7F6] px-4 pt-[120px] pb-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative inline-block">
            <span
              className="text-8xl sm:text-9xl font-display font-black text-[#0B0D0E]/10 select-none block"
              style={{ fontFamily: "var(--font-display)" }}
            >
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-4 py-1.5 rounded-full bg-[#F72585] text-white text-xs font-bold uppercase tracking-widest shadow-md">
                LOST IN THE DROP
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1
              className="font-display font-[350] text-3xl sm:text-4xl text-[#0B0D0E] uppercase tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Page Not Found
            </h1>
            <p className="text-stone-500 text-sm leading-relaxed max-w-sm mx-auto">
              Looks like this piece has been moved or doesn&apos;t exist anymore. Head back to the store to catch our latest drops.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[5px] bg-[#0B0D0E] hover:bg-[#F72585] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Explore Shop
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[5px] bg-white hover:bg-stone-50 text-[#0B0D0E] border border-stone-200 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
