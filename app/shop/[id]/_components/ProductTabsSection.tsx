"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  MessageSquare,
  RotateCcw,
  Heart,
} from "lucide-react";
import ProductReviews from "./ProductReviews";

type ProductTabsSectionProps = {
  productId: string;
  productName: string;
  description?: string;
  features?: string[];
  specifications?: { label: string; value: string }[];
  reviews?: any[];
  onOpenSizeChart?: () => void;
};

export default function ProductTabsSection({
  productId,
  productName,
  description,
  features,
  specifications,
  reviews = [],
  onOpenSizeChart,
}: ProductTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<
    "description" | "specifications" | "size" | "shipping" | "reviews"
  >("description");

  const defaultDescription =
    description ||
    `Make a statement with the TeenZos ${productName}. Designed for those who express more than just style, this piece combines premium comfort with bold street aesthetics. Featuring our signature graffiti artwork, it's the perfect blend of creativity, attitude, and everyday wear.`;

  const defaultFeatures = features || [
    "Premium cotton blend fabric",
    "Soft, breathable & comfortable",
    "Oversized streetwear fit",
    "Ribbed cuffs and hem",
    "High-quality graffiti print"
  ];

  const defaultSpecs = specifications || [
    { label: "Fabric Details", value: "380 GSM Heavyweight Cotton Fleece" },
    { label: "Fit Profile", value: "Relaxed Streetwear Oversized Silhouette" },
    {
      label: "Hood & Neck",
      value: "Double-Layered Hood with Reinforced Eyelets",
    },
    { label: "Graphic Technique", value: "High-Density Screen Graffiti Print" },
    { label: "Stitching Details", value: "Double-Needle Reinforced Seams" },
    {
      label: "Care Instructions",
      value: "Machine wash cold inside out, tumble dry low",
    },
    { label: "Country of Origin", value: "Crafted with Pride in India" },
  ];

  const reviewCount = reviews.length > 0 ? reviews.length : 128;

  return (
    <>

      {/* 1. Trust Badges Row (4 items) - Placed before ProductTabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 py-4 sm:py-5 border-y border-gray-200/70 mt-8 md:mt-10">
        <div className="flex items-center gap-2 sm:gap-2.5 p-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight truncate">Free Shipping</p>
            <p className="text-[10px] text-gray-500 truncate">On all orders</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 p-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight truncate">Premium Quality</p>
            <p className="text-[10px] text-gray-500 truncate">Built to last</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 p-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
            <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight truncate">Easy Returns</p>
            <p className="text-[10px] text-gray-500 truncate">7-day policy</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 p-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
            <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight truncate">10K+ Customers</p>
            <p className="text-[10px] text-gray-500 truncate">Love TeenZos</p>
          </div>
        </div>
      </div>

      {/* 2. tabs section */}
      <div className="w-full bg-white rounded-[5px] border border-gray-200/80 shadow-sm p-4 sm:p-6 lg:p-6 mt-6 md:mt-8">
        {/* Tab Navigation Headers */}
        <div className="flex items-center gap-4 sm:gap-8 border-b border-gray-200 overflow-x-auto scrollbar-hide pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`pb-3 text-sm sm:text-base font-bold whitespace-nowrap transition-colors relative ${
              activeTab === "description"
                ? "text-[#FF007A]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Description
            {activeTab === "description" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF007A] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("specifications")}
            className={`pb-3 text-sm sm:text-base font-bold whitespace-nowrap transition-colors relative ${
              activeTab === "specifications"
                ? "text-[#FF007A]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Specifications
            {activeTab === "specifications" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF007A] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("size")}
            className={`pb-3 text-sm sm:text-base font-bold whitespace-nowrap transition-colors relative ${
              activeTab === "size"
                ? "text-[#FF007A]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Size & Fit
            {activeTab === "size" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF007A] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shipping")}
            className={`pb-3 text-sm sm:text-base font-bold whitespace-nowrap transition-colors relative ${
              activeTab === "shipping"
                ? "text-[#FF007A]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Shipping & Returns
            {activeTab === "shipping" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF007A] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 text-sm sm:text-base font-bold whitespace-nowrap transition-colors relative ${
              activeTab === "reviews"
                ? "text-[#FF007A]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Reviews ({reviewCount})
            {activeTab === "reviews" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF007A] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Description & 6 Checkboxes (Exact Mockup Match) */}
        {activeTab === "description" && (
          <div className="pt-6 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Paragraph Text */}
            <div className="lg:col-span-6 space-y-4">
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {defaultDescription}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                Engineered with durable drop-shoulder proportions, twin-needle
                reinforced seams, and our signature cyberpunk graffiti bunny
                insignia across the back and chest. Built for high rotation in
                your daily rotation.
              </p>
            </div>

            {/* Right: Feature Checklist (with Pink Checkmarks) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
              {defaultFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-[5px] bg-[#FFF0F6] border border-[#FF007A] flex items-center justify-center shrink-0">
                    <svg
                      className="w-3.5 h-3.5 text-[#FF007A]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Specifications */}
        {activeTab === "specifications" && (
          <div className="pt-6 sm:pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultSpecs.map((spec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/40"
                >
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {spec.label}
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Size & Fit */}
        {activeTab === "size" && (
          <div className="pt-6 sm:pt-8 space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-100/80 text-gray-800 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Chest (Inches)</th>
                    <th className="p-3.5">Length (Inches)</th>
                    <th className="p-3.5">Shoulder (Inches)</th>
                    <th className="p-3.5">Sleeve (Inches)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  <tr className="hover:bg-gray-50/70">
                    <td className="p-3.5 font-bold text-gray-900">S</td>
                    <td className="p-3.5">42</td>
                    <td className="p-3.5">27.5</td>
                    <td className="p-3.5">20.5</td>
                    <td className="p-3.5">23.5</td>
                  </tr>
                  <tr className="hover:bg-gray-50/70">
                    <td className="p-3.5 font-bold text-gray-900">M</td>
                    <td className="p-3.5">44</td>
                    <td className="p-3.5">28.5</td>
                    <td className="p-3.5">21.5</td>
                    <td className="p-3.5">24.0</td>
                  </tr>
                  <tr className="bg-[#FFF0F6]/40 hover:bg-[#FFF0F6]/60">
                    <td className="p-3.5 font-black text-[#FF007A]">
                      L (Featured)
                    </td>
                    <td className="p-3.5 font-semibold text-gray-900">46</td>
                    <td className="p-3.5 font-semibold text-gray-900">29.5</td>
                    <td className="p-3.5 font-semibold text-gray-900">22.5</td>
                    <td className="p-3.5 font-semibold text-gray-900">24.5</td>
                  </tr>
                  <tr className="hover:bg-gray-50/70">
                    <td className="p-3.5 font-bold text-gray-900">XL</td>
                    <td className="p-3.5">48</td>
                    <td className="p-3.5">30.5</td>
                    <td className="p-3.5">23.5</td>
                    <td className="p-3.5">25.0</td>
                  </tr>
                  <tr className="hover:bg-gray-50/70">
                    <td className="p-3.5 font-bold text-gray-900">XXL</td>
                    <td className="p-3.5">50</td>
                    <td className="p-3.5">31.5</td>
                    <td className="p-3.5">24.5</td>
                    <td className="p-3.5">25.5</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
                💡 <strong>Fit Tip:</strong> Our hoodie is tailored for an
                oversized streetwear boxy drape. If you prefer a standard
                regular fit, order one size down.
              </p>
              {onOpenSizeChart && (
                <button
                  type="button"
                  onClick={onOpenSizeChart}
                  className="shrink-0 px-4 py-2 rounded-lg bg-[#FF007A] text-white text-xs font-bold hover:bg-[#E0006C] transition-colors"
                >
                  View Full Size Guide
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Shipping & Returns */}
        {activeTab === "shipping" && (
          <div className="pt-6 sm:pt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/60 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F6] text-[#FF007A] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">
                Express Delivery
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Dispatched within 24-48 hours. Delivered across all Indian pin
                codes in 3 to 5 business days with live SMS tracking.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/60 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F6] text-[#FF007A] flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">
                7-Day Free Exchange
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Wrong size? No stress. Request an instant size exchange or
                return within 7 days of delivery. Reverse pickup arranged from
                your doorstep.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/60 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F6] text-[#FF007A] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">
                100% Authentic Quality
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Direct from TeenZos studio. Made with certified heavyweight
                cotton, industrial screen cured inks, and double-stitched
                reinforcements.
              </p>
            </div>
          </div>
        )}

        {/* Tab 5: Reviews */}
        {activeTab === "reviews" && (
          <div className="pt-6 sm:pt-8">
            <ProductReviews productId={productId} initialReviews={reviews} />
          </div>
        )}
      </div>
    </>
  );
}
