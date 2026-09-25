"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, SlidersHorizontal, ChevronDown } from "lucide-react";

interface ShopToolbarProps {
  currentCategoryName: string;
  totalProducts: number;
  filteredProductsCount: number;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid4" | "grid3" | "grid2" | "list";
  onViewModeChange: (mode: "grid4" | "grid3" | "grid2" | "list") => void;
  onOpenMobileFilter: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export default function ShopToolbar({
  currentCategoryName,
  totalProducts,
  filteredProductsCount,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenMobileFilter,
  hasActiveFilters,
  activeFilterCount,
}: ShopToolbarProps) {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 py-3 sm:py-4 border-b border-stone-200 select-none">
      {/* ── Left Side: Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
        <Link
          href="/"
          className="text-stone-500 hover:text-[#0B0D0E] transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
        <Link
          href="/shop"
          className={`hover:text-[#F72585] transition-colors ${
            currentCategoryName === "All Products"
              ? "text-[#F72585] font-bold"
              : "text-stone-500"
          }`}
        >
          Shop
        </Link>
        {currentCategoryName !== "All Products" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-[#F72585] font-bold truncate max-w-[150px]">
              {currentCategoryName}
            </span>
          </>
        )}
      </div>

      {/* ── Right Side: Controls & View Switcher ── */}
      <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4 flex-wrap">
        {/* Mobile Filter Button */}
        <button
          onClick={onOpenMobileFilter}
          className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-bold text-[#0B0D0E] hover:border-[#0B0D0E] shadow-xs active:scale-95 transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#F72585]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#F72585] text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Showing Count Text */}
        <span className="text-stone-500 text-xs sm:text-[13px] font-medium hidden sm:inline-block">
          Showing 1-{filteredProductsCount} of {totalProducts} products
        </span>

        {/* Sort Dropdown */}
        <div className="relative inline-flex items-center">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-white border border-stone-200/90 rounded-lg py-1.5 pl-3 pr-8 text-xs sm:text-[13px] font-semibold text-[#0B0D0E] hover:border-stone-400 focus:outline-none focus:ring-1 focus:ring-[#F72585] cursor-pointer shadow-xs"
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Biggest Discount</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* View Switchers (Grid / List) */}
        <div className="hidden sm:flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
          {/* 4-Column Grid View Button */}
          <button
            onClick={() => onViewModeChange("grid4")}
            aria-label="4 columns grid"
            title="4 columns"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "grid4"
                ? "bg-white text-[#F72585] shadow-xs scale-105"
                : "text-stone-500 hover:text-[#0B0D0E]"
            }`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill={viewMode === "grid4" ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>

          {/* List View Button */}
          <button
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
            title="List view"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "list"
                ? "bg-white text-[#F72585] shadow-xs scale-105"
                : "text-stone-500 hover:text-[#0B0D0E]"
            }`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
