"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ShopMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filteredCount: number;
  totalCount: number;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  children: React.ReactNode;
}

export default function ShopMobileDrawer({
  isOpen,
  onClose,
  filteredCount,
  totalCount,
  onResetFilters,
  hasActiveFilters,
  children,
}: ShopMobileDrawerProps) {
  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] lg:hidden flex">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative mr-auto w-[88%] max-w-sm h-full bg-[#F7F7F6] flex flex-col shadow-2xl z-10 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-stone-200">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl uppercase tracking-wide text-[#0B0D0E]">
              Filters
            </h2>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#F72585]" />
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close filters"
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:text-[#0B0D0E] hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filter Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {children}
        </div>

        {/* Sticky Mobile Footer Actions */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Clear All
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-[2] py-3 px-4 rounded-xl bg-[#0B0D0E] hover:bg-[#F72585] text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md active:scale-98 flex items-center justify-center gap-1.5"
          >
            <span>Apply ({filteredCount} items)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
