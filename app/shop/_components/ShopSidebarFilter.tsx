"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown, RotateCcw, Check } from "lucide-react";
import { ShopCategory } from "@/lib/shopProducts";

interface ShopSidebarFilterProps {
  categories: ShopCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categoryCounts: Record<string, number>;
  priceRange: [number, number];
  onPriceChange: (newMax: number) => void;
  minPriceLimit: number;
  maxPriceLimit: number;
  availableSizes: string[];
  selectedSizes: string[];
  onToggleSize: (size: string) => void;
  availableColors: { name: string; hex: string }[];
  selectedColors: string[];
  onToggleColor: (colorName: string) => void;
  inStockOnly: boolean;
  onToggleInStock: (val: boolean) => void;
  inStockCount: number;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export default function ShopSidebarFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  priceRange,
  onPriceChange,
  minPriceLimit,
  maxPriceLimit,
  availableSizes,
  selectedSizes,
  onToggleSize,
  availableColors,
  selectedColors,
  onToggleColor,
  inStockOnly,
  onToggleInStock,
  inStockCount,
  onResetFilters,
  hasActiveFilters,
}: ShopSidebarFilterProps) {
  // Accordion collapsed state
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    size: true,
    color: true,
    availability: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Category Icon Renderer
  const renderCategoryIcon = (icon: string, isActive: boolean) => {
    const strokeClass = isActive ? "text-[#F72585]" : "text-stone-500";
    switch (icon) {
      case "men":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "women":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case "sparkles":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case "flame":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 010 11.314z" />
          </svg>
        );
      case "trending":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case "tag":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case "hoodie":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 4l-4 4-4-4H4v16h16V4h-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8" />
          </svg>
        );
      case "tshirt":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H4l2 5v13h12V8l2-5h-5a3 3 0 01-6 0z" />
          </svg>
        );
      case "sweatshirt":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l3-3h10l3 3v6l-3-2v11H7V10L4 12V6z" />
          </svg>
        );
      case "jacket":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l4-2h8l4 2v17H4V4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v19" />
          </svg>
        );
      case "bottoms":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v5l-2 13h-3l-1-10-1 10H8L6 8V3z" />
          </svg>
        );
      case "accessories":
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 14a8 8 0 0116 0H4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 14h20l-3 4H5l-3-4z" />
          </svg>
        );
      default: // grid / all
        return (
          <svg className={`w-4 h-4 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ── Reset Filters Header Button ── */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Active Filters
          </span>
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F72585] hover:text-[#D91668] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        </div>
      )}

      {/* ── 1. Categories Accordion ── */}
      <div className="bg-white rounded-[5px] border border-stone-200/90 p-3.5 shadow-xs">
        <button
          onClick={() => toggleSection("categories")}
          className="w-full flex items-center justify-between text-left font-body font-bold text-sm text-[#0B0D0E] pb-2"
        >
          <span>Categories</span>
          {openSections.categories ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {openSections.categories && (
          <div className="space-y-1.5 pt-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isSelected
                      ? "bg-[#FFE1ED] text-[#F72585] shadow-xs font-bold"
                      : "text-stone-700 hover:bg-stone-50 hover:text-[#0B0D0E]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {renderCategoryIcon(cat.icon, isSelected)}
                    <span className="truncate">{cat.name}</span>
                    {cat.badge && (
                      <span
                        className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider shrink-0 ${
                          cat.badge === "HOT"
                            ? "bg-[#F72585] text-white"
                            : cat.badge === "TRENDING"
                            ? "bg-[#36B8C5] text-white"
                            : cat.badge === "EXCLUSIVE"
                            ? "bg-[#9B51E0] text-white"
                            : "bg-[#FFE1ED] text-[#F72585]"
                        }`}
                      >
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] shrink-0 ml-1 ${
                      isSelected ? "text-[#F72585] font-bold" : "text-stone-400"
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Price Range Accordion ── */}
      <div className="bg-white rounded-[5px] border border-stone-200/90 p-3.5 shadow-xs">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-left font-body font-bold text-sm text-[#0B0D0E] pb-2"
        >
          <span>Price Range</span>
          {openSections.price ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {openSections.price && (
          <div className="pt-3 pb-1">
            <input
              type="range"
              min={minPriceLimit}
              max={maxPriceLimit}
              step="100"
              value={priceRange[1]}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#F72585]"
            />

            <div className="flex items-center justify-between mt-3 text-xs font-bold text-stone-700">
              <span className="bg-stone-100 px-2 py-1 rounded-md text-stone-600">
                ₹{priceRange[0]}
              </span>
              <span className="text-stone-400 font-normal">to</span>
              <span className="bg-[#FFE1ED] text-[#F72585] px-2.5 py-1 rounded-md font-black">
                ₹{priceRange[1].toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Size Accordion ── */}
      <div className="bg-white rounded-[5px] border border-stone-200/90 p-3.5 shadow-xs">
        <button
          onClick={() => toggleSection("size")}
          className="w-full flex items-center justify-between text-left font-body font-bold text-sm text-[#0B0D0E] pb-2"
        >
          <span>Size</span>
          {openSections.size ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {openSections.size && (
          <div className="flex flex-wrap gap-2 pt-2">
            {availableSizes.map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => onToggleSize(size)}
                  className={`min-w-[42px] h-9 px-3 rounded-lg text-xs font-bold uppercase transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? "bg-[#0B0D0E] text-white shadow-sm scale-105"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-[#0B0D0E]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Color Accordion ── */}
      <div className="bg-white rounded-[5px] border border-stone-200/90 p-3.5 shadow-xs">
        <button
          onClick={() => toggleSection("color")}
          className="w-full flex items-center justify-between text-left font-body font-bold text-sm text-[#0B0D0E] pb-2"
        >
          <span>Color</span>
          {openSections.color ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {openSections.color && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {availableColors.map((color) => {
              const isSelected = selectedColors.includes(color.name);
              return (
                <button
                  key={color.name}
                  onClick={() => onToggleColor(color.name)}
                  title={color.name}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? "ring-2 ring-[#0B0D0E] ring-offset-2 scale-110 shadow-sm"
                      : "border border-stone-300 hover:scale-110 shadow-xs"
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 stroke-[3] ${
                        color.hex.toLowerCase() === "#ffffff" ||
                        color.hex.toLowerCase() === "#e8e8e6" ||
                        color.hex.toLowerCase() === "#f5ebe6"
                          ? "text-[#0B0D0E]"
                          : "text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Availability Accordion ── */}
      <div className="bg-white rounded-[5px] border border-stone-200/90 p-3.5 shadow-xs">
        <button
          onClick={() => toggleSection("availability")}
          className="w-full flex items-center justify-between text-left font-body font-bold text-sm text-[#0B0D0E] pb-2"
        >
          <span>Availability</span>
          {openSections.availability ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {openSections.availability && (
          <label className="flex items-center gap-2.5 pt-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onToggleInStock(e.target.checked)}
              className="w-4 h-4 rounded text-[#F72585] focus:ring-[#F72585] border-stone-300 cursor-pointer accent-[#F72585]"
            />
            <span className="text-xs font-semibold text-stone-700 group-hover:text-[#0B0D0E] transition-colors">
              In Stock ({inStockCount})
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
