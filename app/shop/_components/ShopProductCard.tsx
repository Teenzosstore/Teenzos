"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ShopProduct, slugify } from "@/lib/shopProducts";

interface ShopProductCardProps {
  product: ShopProduct;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  viewMode?: "grid4" | "grid3" | "grid2" | "list";
}

export default function ShopProductCard({
  product,
  isWishlisted = false,
  onToggleWishlist,
  viewMode = "grid4",
}: ShopProductCardProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.image_url);

  const productSlug = product.slug || slugify(product.name) || product.id;
  const productHref = `/shop/${productSlug}`;

  const activeColor = product.colors?.[selectedColorIdx]?.name || "Standard";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(
      {
        id: product.id,
        name: `${product.name} (${activeColor})`,
        price: product.price,
        image_url: product.image_url,
        category_name: product.category_name,
      },
      {
        event: e,
        sourceElement: e.currentTarget as HTMLElement,
      }
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);

    showToast(`Added ${product.name} (${activeColor}) to bag!`, "success");
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  const handleSelectColor = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorIdx(idx);
  };

  // ── List View Option ──
  if (viewMode === "list") {
    return (
      <div className="group relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white rounded-[5px] border border-stone-200/90 p-3 sm:p-4 hover:border-stone-400 hover:shadow-xl transition-all duration-300">
        {/* List Image Box */}
        <div className="relative aspect-[3.5/4.3] w-full sm:w-44 shrink-0 rounded-[5px] bg-[#F7F7F5] border border-stone-200/60 overflow-hidden  flex items-center justify-center">
          <Link href={productHref} className="block relative w-full h-full">
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 680px) 100vw, 250px"
              onError={() => setImgSrc("/image.png")}
              className="object-cover object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </Link>

          {/* Badge */}
          {product.badge && (
            <span
              className={`absolute top-2 left-2 z-10 text-[10px] font-extrabold px-2 py-0.5 rounded-[3px] uppercase tracking-wider shadow-sm ${
                product.badge.toUpperCase() === "HOT" ||
                product.badge.toUpperCase() === "HOT BESTSELLER" ||
                product.badge.toUpperCase() === "BESTSELLER"
                  ? "bg-[#F47B20] text-white"
                  : product.badge.toUpperCase() === "NEW" ||
                    product.badge.toUpperCase() === "NEW ARRIVALS" ||
                    product.badge.toUpperCase() === "NEW ARRIVAL"
                  ? "bg-[#F72585] text-white"
                  : product.badge.toUpperCase() === "TRENDING"
                  ? "bg-[#36B8C5] text-white"
                  : product.badge.toUpperCase() === "EXCLUSIVE" ||
                    product.badge.toUpperCase() === "LIMITED" ||
                    product.badge.toUpperCase() === "LIMITED EDITION"
                  ? "bg-[#9333EA] text-white"
                  : "bg-[#0B0D0E] text-white"
              }`}
            >
              {product.badge}
            </span>
          )}

          {/* Heart Button */}
          <button
            onClick={handleWishlistClick}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#F72585] border border-[#F72585] hover:text-[#F72585] hover:bg-white shadow-sm transition-all duration-200"
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125"
              viewBox="0 0 24 24"
              fill={isWishlisted ? "#F72585" : "none"}
              stroke={isWishlisted ? "#F72585" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* List Info */}
        <div className="flex flex-col flex-grow justify-between w-full py-1">
          <div>
            <span className="text-[11px] font-bold text-[#F72585] uppercase tracking-wider">
              {product.category_name}
            </span>

            <Link
              href={productHref}
              className="block font-body font-semibold text-[#0B0D0E] text-base sm:text-lg hover:text-[#F72585] transition-colors line-clamp-1 mt-0.5"
            >
              {product.name}
            </Link>

            <p className="text-stone-500 text-xs sm:text-sm line-clamp-2 mt-1">
              {product.description || "Streetwear oversized fit with premium graphic print."}
            </p>

            {/* Price & Discount */}
            <div className="flex items-center gap-2 mt-2">
              <span className="font-body font-black text-[#0B0D0E] text-[16px] sm:text-[18px]">
                ₹{product.price}
              </span>
              <span className="font-body text-[#8B9196] text-[12.5px] sm:text-[13.5px] line-through">
                ₹{product.oldPrice}
              </span>
              <span className="font-body font-bold text-[#F72585] text-[11.5px] sm:text-[12.5px] tracking-tight">
                {product.discount}
              </span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100">
            {/* Color Swatches */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {product.colors.map((colorObj, cIdx) => {
                const isSelected = cIdx === selectedColorIdx;
                return (
                  <button
                    key={cIdx}
                    onClick={(e) => handleSelectColor(cIdx, e)}
                    aria-label={`Select color ${colorObj.name}`}
                    title={colorObj.name}
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-[#0B0D0E] ring-offset-2 scale-110 shadow-sm"
                        : "border border-stone-300 hover:scale-115 hover:border-stone-500 opacity-90 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: colorObj.hex }}
                  />
                );
              })}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all duration-200 ${
                isAdded
                  ? "bg-[#36B8C5] text-white scale-105 shadow-md"
                  : "bg-[#0B0D0E] hover:bg-[#F72585] text-white shadow-sm hover:scale-105 active:scale-95"
              }`}
            >
              {isAdded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Exact Home Page TrendingNow Card Design ──
  return (
    <div
      key={product.id}
      className="group relative flex flex-col justify-between bg-white rounded-[5px] border border-stone-200/90 p-2.5 sm:p-2.5 md:p-3 hover:border-stone-400 hover:shadow-xl transition-all duration-300"
    >
      {/* ── Image Box with rounded-[5px] ── */}
      <div className="relative aspect-[4/4.3] w-full rounded-[5px] bg-[#F7F7F5] border border-stone-200/60 overflow-hidden mb-2.5 sm:mb-3 flex items-center justify-center">
        <Link href={productHref} className="block relative w-full h-full">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgSrc("/image.png")}
            className="object-cover object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Optional Badge */}
        {product.badge && (
          <span
            className={`absolute top-2 left-2 z-10 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-[3px] uppercase tracking-wider shadow-sm ${
              product.badge.toUpperCase() === "HOT" ||
              product.badge.toUpperCase() === "HOT BESTSELLER" ||
              product.badge.toUpperCase() === "BESTSELLER"
                ? "bg-[#F47B20] text-white"
                : product.badge.toUpperCase() === "NEW" ||
                  product.badge.toUpperCase() === "NEW ARRIVALS" ||
                  product.badge.toUpperCase() === "NEW ARRIVAL"
                ? "bg-[#F72585] text-white"
                : product.badge.toUpperCase() === "TRENDING"
                ? "bg-[#36B8C5] text-white"
                : product.badge.toUpperCase() === "EXCLUSIVE" ||
                  product.badge.toUpperCase() === "LIMITED" ||
                  product.badge.toUpperCase() === "LIMITED EDITION"
                ? "bg-[#9333EA] text-white"
                : "bg-[#0B0D0E] text-white"
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#F72585] border border-[#F72585] hover:text-[#F72585] hover:bg-white shadow-sm transition-all duration-200"
        >
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 transition-transform active:scale-125"
            viewBox="0 0 24 24"
            fill={isWishlisted ? "#F72585" : "none"}
            stroke={isWishlisted ? "#F72585" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* ── Product Info & Bottom Actions ── */}
      <div className="flex flex-col flex-grow justify-between px-0.5">
        <div>
          {/* Category & 5 Stars with (Review Count) */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold text-[#F72585] uppercase tracking-wider">
              {product.category_name || "Streetwear"}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const cardReviewCount = Number(product.review_count) || 0
                  const cardRating = cardReviewCount > 0 && Number(product.rating) > 0 ? Number(product.rating) : 5
                  return (
                    <Star
                      key={i}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                        i < Math.round(cardRating)
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "fill-stone-200 text-stone-200"
                      }`}
                    />
                  )
                })}
              </div>
              <span className="text-[10.5px] sm:text-[11px] text-stone-500 font-bold leading-none">
                ({Number(product.review_count) || 0})
              </span>
            </div>
          </div>

          {/* Name */}
          <Link
            href={productHref}
            className="font-body font-semibold text-[#0B0D0E] text-[12.5px] sm:text-[14px] md:text-[15px] leading-snug line-clamp-1 hover:text-[#F72585] transition-colors"
          >
            {product.name}
          </Link>

          {/* Price & Discount */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 mb-2 sm:mb-2.5 flex-wrap">
            <span className="font-body font-black text-[#0B0D0E] text-[13.5px] sm:text-[15px] md:text-[16px]">
              ₹{product.price}
            </span>
            <span className="font-body text-[#8B9196] text-[10.5px] sm:text-[11.5px] md:text-[12.5px] line-through">
              ₹{product.oldPrice}
            </span>
            <span className="font-body font-bold text-[#F72585] text-[10px] sm:text-[11px] md:text-[12px] tracking-tight">
              {product.discount}
            </span>
          </div>
        </div>

        {/* Bottom Row: Color Swatches with Space + Add to Cart Button */}
        <div className="flex items-center justify-between px-0.5 sm:px-1.5 pt-2 border-t border-stone-100 mt-auto">
          {/* Color Swatches with Generous Spacing */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {product.colors.map((colorObj, cIdx) => {
              const isSelectedColor = cIdx === selectedColorIdx;
              return (
                <button
                  key={cIdx}
                  onClick={(e) => handleSelectColor(cIdx, e)}
                  aria-label={`Select color ${colorObj.name}`}
                  title={colorObj.name}
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-200 cursor-pointer ${
                    isSelectedColor
                      ? "ring-2 ring-[#0B0D0E] ring-offset-1 sm:ring-offset-2 scale-110 shadow-sm"
                      : "border border-stone-300 hover:scale-115 hover:border-stone-500 opacity-90 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: colorObj.hex }}
                />
              );
            })}
          </div>

          {/* Add to Cart Icon Button */}
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
              isAdded
                ? "bg-[#36B8C5] text-white scale-110 shadow-md"
                : "bg-[#0B0D0E] hover:bg-[#F72585] text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
            }`}
            title="Add to cart"
          >
            {isAdded ? (
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
