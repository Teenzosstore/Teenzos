"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ShopProduct, slugify } from "@/lib/shopProducts";
import { productLoaderFor } from "@/lib/imagekitImage";

const COLOR_HEX_MAP: Record<string, string> = {
  black: "#0B0D0E",
  white: "#FFFFFF",
  snow: "#F8F9FA",
  cream: "#F5EBE6",
  beige: "#E8D8C8",
  sand: "#D2B48C",
  grey: "#808080",
  gray: "#808080",
  "light grey": "#E8E8E6",
  "light gray": "#E8E8E6",
  "heather grey": "#9E9E9E",
  charcoal: "#2D3134",
  pink: "#F72585",
  "hot pink": "#FF007A",
  red: "#E63946",
  maroon: "#800000",
  burgundy: "#800020",
  orange: "#FF6B35",
  yellow: "#FFD166",
  green: "#2A9D8F",
  olive: "#556B2F",
  sage: "#87A96B",
  blue: "#1D3557",
  navy: "#0A192F",
  cyan: "#36B8C5",
  teal: "#0891B2",
  purple: "#7209B7",
  lavender: "#E6E6FA",
  brown: "#6B4226",
  mocha: "#7B5E57",
  khaki: "#C3B091",
};

export function getHexForColor(name: string): string {
  if (!name) return "#0B0D0E";
  const lower = name.toLowerCase().trim();
  if (COLOR_HEX_MAP[lower]) return COLOR_HEX_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return val;
  }
  return "#0B0D0E";
}

export function resolveProductColors(product: any): { name: string; hex: string; image_url?: string }[] {
  if (!product) return [{ name: "Black", hex: "#0B0D0E" }];

  const allImages: { image_url: string; color_name?: string | null }[] = [];
  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    product.product_images.forEach((img: any) => {
      if (img?.image_url) allImages.push({ image_url: img.image_url, color_name: img.color_name });
    });
  }
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img: any) => {
      if (img?.image_url) allImages.push({ image_url: img.image_url, color_name: img.color_name });
    });
  }
  if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
    product.gallery_images.forEach((url: string) => {
      if (url && !allImages.some((i) => i.image_url === url)) {
        allImages.push({ image_url: url, color_name: null });
      }
    });
  }
  if (product.image_url && !allImages.some((i) => i.image_url === product.image_url)) {
    allImages.unshift({ image_url: product.image_url, color_name: null });
  }

  const resultColors: { name: string; hex: string; image_url?: string }[] = [];
  const addedNames = new Set<string>();

  // 1. Structured product.colors array
  if (Array.isArray(product.colors) && product.colors.length > 0) {
    product.colors.forEach((c: any, i: number) => {
      const name = typeof c === "string" ? c.trim() : (c.name || `Color ${i + 1}`).trim();
      const norm = name.toLowerCase();
      if (!addedNames.has(norm)) {
        addedNames.add(norm);
        const hex = typeof c === "object" && c.hex && c.hex !== "#0B0D0E" ? c.hex : getHexForColor(name);
        const img = (typeof c === "object" && c.image_url) || allImages[i]?.image_url || product.image_url;
        resultColors.push({ name, hex, image_url: img });
      }
    });
  }

  // 2. Parse product.color_name (JSON array or comma-separated)
  if (resultColors.length <= 1 && product.color_name) {
    const raw = product.color_name;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((c: any, i: number) => {
              const name = typeof c === "string" ? c.trim() : (c.name || `Color ${i + 1}`).trim();
              const norm = name.toLowerCase();
              if (!addedNames.has(norm)) {
                addedNames.add(norm);
                const hex = typeof c === "object" && c.hex ? c.hex : getHexForColor(name);
                const img = (typeof c === "object" && c.image_url) || allImages[i]?.image_url;
                resultColors.push({ name, hex, image_url: img });
              }
            });
          }
        } catch (e) {}
      } else {
        const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) {
          parts.forEach((name, i) => {
            const norm = name.toLowerCase();
            if (!addedNames.has(norm)) {
              addedNames.add(norm);
              resultColors.push({
                name,
                hex: getHexForColor(name),
                image_url: allImages[i]?.image_url,
              });
            }
          });
        }
      }
    }
  }

  // 3. Extract colors from product_images color_name attribute
  if (allImages.length > 0) {
    allImages.forEach((img) => {
      if (img.color_name && img.color_name.trim()) {
        const name = img.color_name.trim();
        const norm = name.toLowerCase();
        if (!addedNames.has(norm)) {
          addedNames.add(norm);
          resultColors.push({
            name,
            hex: getHexForColor(name),
            image_url: img.image_url,
          });
        }
      }
    });
  }

  // 4. Extract colors from product_variants (e.g. "Black - M", "White - L")
  if (Array.isArray(product.product_variants) && product.product_variants.length > 0) {
    product.product_variants.forEach((v: any) => {
      const vName = v.variant_name || "";
      if (vName.includes("-")) {
        const colorPart = vName.split("-")[0].trim();
        const norm = colorPart.toLowerCase();
        if (colorPart && !addedNames.has(norm)) {
          addedNames.add(norm);
          resultColors.push({
            name: colorPart,
            hex: getHexForColor(colorPart),
            image_url: allImages[resultColors.length]?.image_url,
          });
        }
      }
    });
  }

  // 5. If multiple images available and only 1 or 0 colors found so far:
  // Map available images to distinct streetwear colors!
  if (resultColors.length <= 1 && allImages.length > 1) {
    const defaultColorNames = ["Black", "White", "Cream", "Pink", "Cyan", "Grey"];
    const newColors: { name: string; hex: string; image_url?: string }[] = [];
    allImages.slice(0, 5).forEach((img, idx) => {
      const name = img.color_name || defaultColorNames[idx] || `Color ${idx + 1}`;
      newColors.push({
        name,
        hex: getHexForColor(name),
        image_url: img.image_url,
      });
    });
    return newColors;
  }

  // 6. If at least 1 color found, ensure every color has an image_url
  if (resultColors.length > 0) {
    return resultColors.map((c, i) => ({
      ...c,
      image_url: c.image_url || allImages[i]?.image_url || product.image_url || "/image.png",
    }));
  }

  // 7. Fallback single color
  return [{ name: "Black", hex: "#0B0D0E", image_url: product.image_url || "/image.png" }];
}

export interface TrendingProductCardProps {
  product: ShopProduct | any;
  isLiked?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  // "large": editorial look for the homepage — tall full-bleed image, minimal text.
  variant?: "default" | "large";
}

export default function TrendingProductCard({
  product,
  isLiked = false,
  isWishlisted = false,
  onToggleWishlist,
  variant = "default",
}: TrendingProductCardProps) {
  const isLarge = variant === "large";
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const productHref = `/shop/${product.slug || slugify(product.name) || product.id}`;
  const isHeartActive = Boolean(isWishlisted || isLiked);

  // Resolve all available colors for this product
  const resolvedColors = useMemo(() => {
    return resolveProductColors(product);
  }, [product]);

  // Image switches dynamically when a color is selected
  const activeImage = useMemo(() => {
    if (resolvedColors && resolvedColors.length > 0) {
      const curColor = resolvedColors[selectedColorIdx] || resolvedColors[0];
      if (curColor?.image_url) return curColor.image_url;

      const normName = curColor?.name?.toLowerCase().trim();
      const allImgs: any[] = product.product_images || product.images || [];

      if (normName) {
        const match = allImgs.find(
          (img: any) => img.color_name && img.color_name.toLowerCase().trim() === normName
        );
        if (match?.image_url) return match.image_url;
      }

      const gallery: string[] = product.gallery_images || [];
      if (gallery[selectedColorIdx]) return gallery[selectedColorIdx];

      if (allImgs[selectedColorIdx]?.image_url) return allImgs[selectedColorIdx].image_url;
    }

    return product.image_url || "/image.png";
  }, [product, resolvedColors, selectedColorIdx]);

  const handleSelectColor = (cIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorIdx(cIdx);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const selectedColor =
      resolvedColors && resolvedColors.length > 0
        ? resolvedColors[selectedColorIdx]?.name
        : "Standard";

    addToCart(
      {
        id: product.id,
        name: `${product.name}${selectedColor && selectedColor !== "Standard" ? ` (${selectedColor})` : ""}`,
        price: product.price,
        image_url: activeImage,
        category_name: product.category_name || "Streetwear",
        variant_name: selectedColor || "Standard",
      },
      {
        event: e,
        sourceElement: e.currentTarget as HTMLElement,
      }
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1400);

    showToast(`Added ${product.name} (${selectedColor}) to bag!`, "success");
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onToggleWishlist) {
      onToggleWishlist(product.id);
      return;
    }

    // Fallback internal toggle
    try {
      let currentMap: Record<string, boolean> = {};
      const saved = localStorage.getItem("teenzos_wishlist");
      if (saved) currentMap = JSON.parse(saved);
      const nextVal = !currentMap[product.id];
      currentMap[product.id] = nextVal;
      localStorage.setItem("teenzos_wishlist", JSON.stringify(currentMap));

      // Cache product
      let cachedProducts: Record<string, any> = {};
      try {
        const raw = localStorage.getItem("teenzos_wishlist_products");
        if (raw) cachedProducts = JSON.parse(raw);
      } catch {}
      if (nextVal) {
        cachedProducts[product.id] = {
          id: product.id,
          slug: product.slug || product.id,
          name: product.name,
          category_id: product.category_id,
          category_name: product.category_name || "Streetwear",
          price: product.price,
          oldPrice: product.oldPrice,
          discount: product.discount,
          image_url: activeImage || product.image_url,
          badge: product.badge,
          rating: product.rating,
          review_count: product.review_count,
          sizes: product.sizes || ["S", "M", "L", "XL"],
          colors: resolvedColors || product.colors,
          product_images: product.product_images,
          gallery_images: product.gallery_images,
        };
      } else {
        delete cachedProducts[product.id];
      }
      localStorage.setItem("teenzos_wishlist_products", JSON.stringify(cachedProducts));

      window.dispatchEvent(new Event("teenzos-wishlist-change"));

      if (nextVal) {
        showToast("Saved to wishlist!", "success");
      } else {
        showToast("Removed from wishlist", "info");
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  return (
    <div
      className={
        isLarge
          ? "group relative flex flex-col w-full h-full"
          : "group relative flex flex-col justify-between bg-white rounded-[5px] border border-stone-200/90 p-2.5 sm:p-3 hover:border-stone-400 hover:shadow-xl transition-all duration-300 w-full h-full"
      }
    >
      {/* ── Image Box ── */}
      <div
        className={
          isLarge
            ? "relative w-full min-h-[240px] rounded-2xl bg-[#F1F1EF] overflow-hidden mb-3"
            : "relative aspect-[4/5] w-full rounded-[5px] bg-[#F7F7F5] border border-stone-200/60 overflow-hidden mb-2.5 sm:mb-3 flex items-center justify-center"
        }
      >
        <Link href={productHref} className={isLarge ? "block w-full" : "block relative w-full h-full"}>
          {isLarge ? (
            // Natural aspect ratio: the whole photo is always visible (never
            // cropped) and fills the full card width with no empty bands.
            <Image
              key={activeImage}
              src={activeImage}
              alt={`${product.name} - ${resolvedColors[selectedColorIdx]?.name || ""}`}
              width={0}
              height={0}
              loader={productLoaderFor(activeImage)}
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              style={{ width: "100%", height: "auto" }}
              className="block transform group-hover:scale-105 transition-all duration-300 ease-out"
              onError={(e) => {
                e.currentTarget.src = "/image.png";
              }}
            />
          ) : (
            <Image
              key={activeImage}
              src={activeImage}
              alt={`${product.name} - ${resolvedColors[selectedColorIdx]?.name || ""}`}
              fill
              loader={productLoaderFor(activeImage)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover object-center transform group-hover:scale-105 transition-all duration-300 ease-out"
              onError={(e) => {
                e.currentTarget.src = "/image.png";
              }}
            />
          )}
        </Link>

        {/* Badge (if product has one) */}
        {product.badge && (
          <span
            className={`absolute top-2 left-2 z-10 text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px] border shadow-sm pointer-events-none ${
              product.badge.toUpperCase() === "HOT" ||
              product.badge.toUpperCase() === "HOT BESTSELLER" ||
              product.badge.toUpperCase() === "BESTSELLER"
                ? "bg-[#FFF0E3] text-[#F47B20] border-[#F47B20]/30"
                : product.badge.toUpperCase() === "TRENDING"
                ? "bg-[#DDF6F8] text-[#0891B2] border-[#36B8C5]/30"
                : product.badge.toUpperCase() === "EXCLUSIVE" ||
                  product.badge.toUpperCase() === "LIMITED" ||
                  product.badge.toUpperCase() === "LIMITED EDITION"
                ? "bg-[#F3E8FF] text-[#9333EA] border-[#9333EA]/30"
                : "bg-[#FFE1ED] text-[#F72585] border-[#F72585]/30"
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Wishlist Heart Button (Exact shop page style) */}
        <button
          type="button"
          onClick={handleWishlistClick}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          aria-label={isHeartActive ? "Remove from wishlist" : "Add to wishlist"}
          title={isHeartActive ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#F72585] border border-[#F72585] hover:text-[#F72585] hover:bg-white shadow-sm transition-all duration-200 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125 pointer-events-none"
            viewBox="0 0 24 24"
            fill={isHeartActive ? "#F72585" : "none"}
            stroke={isHeartActive ? "#F72585" : "currentColor"}
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
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F72585]">
              {product.category_name || "Streetwear"}
            </span>
            <div className={`${isLarge ? "hidden" : "flex"} items-center gap-1 shrink-0`}>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const cardReviewCount = Number(product.review_count) || 0;
                  const cardRating = cardReviewCount > 0 && Number(product.rating) > 0 ? Number(product.rating) : 5;
                  return (
                    <Star
                      key={i}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                        i < Math.round(cardRating)
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "fill-stone-200 text-stone-200"
                      }`}
                    />
                  );
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
            className={`font-body font-semibold text-[#0B0D0E] text-[13px] sm:text-[14px] md:text-[14.5px] leading-snug hover:text-[#F72585] transition-colors ${isLarge ? "line-clamp-2" : "line-clamp-1"}`}
          >
            {product.name}
          </Link>

          {/* Price & Discount */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 mb-2.5 flex-wrap">
            <span className="font-body font-black text-[#0B0D0E] text-[14px] sm:text-[15.5px]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.oldPrice && (
              <span className="font-body text-[#8B9196] text-[11px] sm:text-[12px] line-through">
                ₹{product.oldPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className="font-body font-bold text-[#F72585] text-[10.5px] sm:text-[11.5px] tracking-tight">
              {product.discount}
            </span>
          </div>
        </div>

        {/* Bottom Row: Color Swatches + Add to Cart Button */}
        <div className={`flex items-center justify-between pt-2 mt-auto gap-2 ${isLarge ? "" : "border-t border-stone-100"}`}>
          {/* Color Swatches */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {resolvedColors.map((colorObj, cIdx) => {
              const isSelectedColor = cIdx === selectedColorIdx;
              return (
                <button
                  key={cIdx}
                  type="button"
                  onClick={(e) => handleSelectColor(cIdx, e)}
                  aria-label={`Select color ${colorObj.name}`}
                  title={colorObj.name}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 cursor-pointer ${
                    isSelectedColor
                      ? "ring-2 ring-[#0B0D0E] ring-offset-1 scale-125 shadow-sm"
                      : "border border-stone-300 hover:scale-115 hover:border-stone-500 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: colorObj.hex }}
                />
              );
            })}
          </div>

          {/* Add to Cart Icon Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer ${
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
