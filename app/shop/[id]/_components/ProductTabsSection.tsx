"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CheckSquare,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  MessageSquare,
  RotateCcw,
  Heart,
  Maximize2,
} from "lucide-react";
import ProductReviews from "./ProductReviews";
import SizeChartPopup from "./SizeChartPopup";

type ProductTabsSectionProps = {
  productId: string;
  productName: string;
  description?: string;
  features?: string[];
  specifications?: { label: string; value: string }[];
  reviews?: any[];
  sizeChart?: {
    imageUrl: string;
    title: string;
  } | null;
  onOpenSizeChart?: () => void;
  currentUser?: { id: string; name?: string } | null;
};

export default function ProductTabsSection({
  productId,
  productName,
  description,
  features,
  specifications,
  reviews = [],
  sizeChart,
  onOpenSizeChart,
  currentUser,
}: ProductTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<
    "description" | "specifications" | "size" | "shipping" | "reviews"
  >("description");
  const [showSizeChartPopup, setShowSizeChartPopup] = useState(false);
  const [liveReviewCount, setLiveReviewCount] = useState<number>(reviews.length);

  const hasSizeChart = Boolean(sizeChart?.imageUrl && sizeChart.imageUrl.trim() !== "");

  React.useEffect(() => {
    if (!hasSizeChart && activeTab === "size") {
      setActiveTab("description");
    }
  }, [hasSizeChart, activeTab]);

  React.useEffect(() => {
    setLiveReviewCount(reviews.length);
  }, [reviews.length]);

  React.useEffect(() => {
    const handleOpenReviews = () => {
      setActiveTab("reviews");
      const el = document.getElementById("product-tabs");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    };
    const handleNewReview = () => {
      setLiveReviewCount((prev) => prev + 1);
    };

    window.addEventListener("teenzos-open-reviews-tab", handleOpenReviews);
    window.addEventListener("teenzos-review-added", handleNewReview);

    return () => {
      window.removeEventListener("teenzos-open-reviews-tab", handleOpenReviews);
      window.removeEventListener("teenzos-review-added", handleNewReview);
    };
  }, []);

  const defaultDescription =
    description ||
    `Make a statement with the TeenZos ${productName}. Designed for those who express more than just style, this piece combines premium comfort with bold street aesthetics. Featuring our signature graffiti artwork, it's the perfect blend of creativity, attitude, and everyday wear.`;

  const productHighlights =
    features && Array.isArray(features) ? features.filter(Boolean) : [];

  const defaultSpecs = specifications || [
    { label: "Fabric Details", value: "380 GSM Heavyweight Cotton Fleece" },
    { label: "Fit Profile", value: "Relaxed Streetwear Oversized Silhouette" },
    { label: "Stitching Details", value: "Double-Needle Reinforced Seams" },
    {
      label: "Care Instructions",
      value: "Machine wash cold inside out, tumble dry low",
    },
    { label: "Country of Origin", value: "Crafted with Pride in India" },
  ];

  return (
    <>
      {/* 1. Trust Badges Row (4 items) - Placed before ProductTabs */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 py-3 sm:py-5 items-center border-y border-gray-200/70 mt-8 md:mt-10 px-4">
          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 py-1 px-1 sm:p-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight truncate">
                Free Shipping
              </p>
              <p className="text-[10px] text-gray-500 truncate">On all orders</p>
            </div>
          </div>

          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 py-1 px-1 sm:p-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight truncate">
                Premium Quality
              </p>
              <p className="text-[10px] text-gray-500 truncate">Built to last</p>
            </div>
          </div>

          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 py-1 px-1 sm:p-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
              <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight truncate">
                Easy Returns
              </p>
              <p className="text-[10px] text-gray-500 truncate">7-day policy</p>
            </div>
          </div>

          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 py-1 px-1 sm:p-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
              <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight truncate">
                10K+ Customers
              </p>
              <p className="text-[10px] text-gray-500 truncate">Love TeenZos</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. tabs section */}
      <div id="product-tabs" className="w-full bg-white rounded-[5px] border border-gray-200/80 shadow-sm p-4 sm:p-6 lg:p-6 mt-6 md:mt-8">
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

          {hasSizeChart && (
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
          )}

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
            Reviews ({liveReviewCount})
            {activeTab === "reviews" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF007A] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Description & Key Highlights (Only rendered if added to this product) */}
        {activeTab === "description" && (
          <div
            className={`pt-6 sm:pt-8 grid grid-cols-1 ${
              productHighlights.length > 0 ? "lg:grid-cols-12" : "max-w-4xl"
            } gap-8 items-start`}
          >
            {/* Paragraph Text */}
            <div
              className={`${
                productHighlights.length > 0 ? "lg:col-span-6" : "w-full"
              } space-y-4`}
            >
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {defaultDescription}
              </p>
            </div>

            {/* Right: Feature Checklist (with Pink Checkmarks) - Only shown if highlights exist */}
            {productHighlights.length > 0 && (
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
                {productHighlights.map((feature, idx) => (
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
            )}
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
        {hasSizeChart && activeTab === "size" && (
          <div className="pt-6 sm:pt-8 space-y-6">
            {/* Header info */}
            <div className="text-center max-w-xl mx-auto mb-2">
              <h3 className="text-base sm:text-xl font-bold text-gray-900 uppercase tracking-tight">
                {sizeChart?.title || "Size & Fit Guide"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Click on the size chart image to open full interactive preview
                with zoom and pan.
              </p>
            </div>

            {/* Responsive Container: 1 Col on Mobile, 2 Cols on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-center max-w-4xl mx-auto">
              {/* Col 1: Size Chart Image Card */}
              <div className="flex flex-col items-center justify-center w-full">
                <div
                  onClick={() => setShowSizeChartPopup(true)}
                  className="group relative w-full max-w-[360px] sm:max-w-[420px] aspect-[4/3] bg-white rounded-[6px] border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer flex items-center justify-center p-2 sm:p-3"
                  title="Click to preview & zoom size chart"
                >
                  <Image
                    src={
                      sizeChart?.imageUrl ||
                      "https://ik.imagekit.io/n6nsqvnx44/rawflex/size-charts/size-chart_6224wy2o3.png"
                    }
                    alt={sizeChart?.title || "Size Chart"}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-contain p-2 sm:p-4 group-hover:scale-[1.02] transition-transform duration-300 !rounded-sm"
                  />

                  {/* Hover / Tap Preview Overlay Badge */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200 flex items-center justify-center">
                    <div className="opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 bg-black/80 backdrop-blur-md text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-none">
                      <Maximize2 className="w-4 h-4 text-[#FF007A]" />
                      <span>Click to Preview & Zoom</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Col 2: Quick Measurement Advice Cards */}
              <div className="flex flex-col gap-3 w-full max-w-[360px] sm:max-w-[420px] mx-auto md:mx-0">
                <div className="p-3.5 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/70 text-left">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    Chest Measurement
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-snug">
                    Measure around the fullest part of your chest, keeping tape
                    horizontal.
                  </p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/70 text-left">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    Length Measurement
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-snug">
                    Measure from highest shoulder point straight down to the
                    bottom hem.
                  </p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/70 text-left">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    Streetwear Fit Tip
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-snug">
                    All TeenZos garments feature a relaxed drop-shoulder
                    oversized fit.
                  </p>
                </div>
              </div>
            </div>

            {/* Size Chart Popup */}
            {sizeChart?.imageUrl && (
              <SizeChartPopup
                isOpen={showSizeChartPopup}
                onClose={() => setShowSizeChartPopup(false)}
                imageUrl={sizeChart.imageUrl}
                title={sizeChart.title || "TeenZos Size Chart"}
              />
            )}
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
            <ProductReviews productId={productId} initialReviews={reviews} currentUser={currentUser} />
          </div>
        )}
      </div>
    </>
  );
}
