"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

// ==========================================
// TYPES & DATA
// ==========================================

export interface TrendingProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  image: string;
  link: string;
  categories: string[];
  colors: { name: string; hex: string }[];
}

const FILTER_TABS = [
  { id: "all", label: "ALL" },
  { id: "oversized", label: "OVERSIZED" },
  { id: "graphic", label: "GRAPHIC" },
  { id: "minimal", label: "MINIMAL" },
  { id: "anime", label: "ANIME" },
  { id: "quote", label: "QUOTE" },
  { id: "street", label: "STREET" },
];

const TRENDING_PRODUCTS: TrendingProduct[] = [
  {
    id: "prod-1",
    name: "Neon Bunny Oversized Tee",
    price: 699,
    originalPrice: 999,
    discount: "30% OFF",
    image: "/images/trending_now/trending_now1.jpeg",
    link: "/shop?product=neon-bunny-oversized-tee",
    categories: ["all", "oversized", "street", "anime"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Cyan", hex: "#36B8C5" },
      { name: "Pink", hex: "#F72585" },
      { name: "Light Grey", hex: "#E8E8E6" },
    ],
  },
  {
    id: "prod-2",
    name: "Chase Your Dreams Tee",
    price: 799,
    originalPrice: 1099,
    discount: "27% OFF",
    image: "/images/trending_now/trending_now2.jpeg",
    link: "/shop?product=chase-your-dreams-tee",
    categories: ["all", "quote", "oversized", "minimal"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Cream", hex: "#F5EBE6" },
    ],
  },
  {
    id: "prod-3",
    name: "Reality Check Tee",
    price: 699,
    originalPrice: 999,
    discount: "30% OFF",
    image: "/images/trending_now/trending_now3.jpeg",
    link: "/shop?product=reality-check-tee",
    categories: ["all", "graphic", "anime", "street"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Charcoal", hex: "#1A1E20" },
    ],
  },
  {
    id: "prod-4",
    name: "Teenzos Classic Tee",
    price: 599,
    originalPrice: 899,
    discount: "33% OFF",
    image: "/images/trending_now/trending_now4.jpeg",
    link: "/shop?product=teenzos-classic-tee",
    categories: ["all", "minimal", "street", "anime"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Cyan", hex: "#36B8C5" },
      { name: "Black", hex: "#0B0D0E" },
    ],
  },
  {
    id: "prod-5",
    name: "Good Days Ahead Tee",
    price: 699,
    originalPrice: 999,
    discount: "30% OFF",
    image: "/images/trending_now/trending_now5.jpeg",
    link: "/shop?product=good-days-ahead-tee",
    categories: ["all", "street", "graphic", "anime"],
    colors: [
      { name: "Midnight", hex: "#1F2428" },
      { name: "Black", hex: "#0B0D0E" },
      { name: "White", hex: "#FFFFFF" },
    ],
  },
];

// ==========================================
// COMPONENT
// ==========================================

export default function TrendingNow() {
  const [activeTab, setActiveTab] = useState("all");
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [selectedColorMap, setSelectedColorMap] = useState<Record<string, number>>({});
  const [addedAnimation, setAddedAnimation] = useState<Record<string, boolean>>({});

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return TRENDING_PRODUCTS;
    return TRENDING_PRODUCTS.filter((p) => p.categories.includes(activeTab));
  }, [activeTab]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectColor = (productId: string, colorIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorMap((prev) => ({ ...prev, [productId]: colorIdx }));
  };

  const handleAddToCart = (product: TrendingProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const selectedColor = product.colors[selectedColorMap[product.id] || 0]?.name || "Standard";

    addToCart({
      id: product.id,
      name: `${product.name} (${selectedColor})`,
      price: product.price,
      image_url: product.image,
      category_name: "Trending Tees",
    });

    // Trigger local feedback animation
    setAddedAnimation((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);

    showToast(`Added ${product.name} (${selectedColor}) to bag!`, "success");
  };

  return (
    <section
      id="trending-now"
      aria-label="Trending Now - Most Loved Tees"
      className="w-full bg-[#FFFFFF] py-8 sm:py-12 md:py-16 lg:py-20 select-none overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        
        {/* ── Section Header & Filter Navigation ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7 sm:mb-9">
          {/* Title Area */}
          <div className="flex flex-col">
            <span className="font-body font-medium text-[11px] sm:text-xs md:text-[13px] text-[#6B7073] tracking-[0.24em] uppercase mb-1.5 ml-0.5">
              TRENDING NOW
            </span>
            <h2 className="font-display font-[350] text-[#0B0D0E] text-2xl sm:text-3xl md:text-4xl lg:text-[42px] tracking-tight uppercase leading-none">
              MOST LOVED TEES
            </h2>
          </div>

          {/* Filter Pills & View All */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-[5px] text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    isActive
                      ? "bg-[#0B0D0E] text-white shadow-sm"
                      : "bg-[#F1F1EF] text-[#6B7073] hover:bg-[#E8E8E6] hover:text-[#0B0D0E]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            {/* View All Action */}
            <Link
              href="/shop?filter=trending"
              className="group hidden sm:inline-flex items-center gap-1.5 font-body font-bold text-xs sm:text-sm text-[#0B0D0E] hover:text-[#F72585] transition-colors ml-2"
            >
              <span>View All</span>
              <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-sm leading-none">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* ── Products Grid (5 Columns on Desktop with Increased Width & Height) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6">
          {filteredProducts.map((product) => {
            const isLiked = !!wishlist[product.id];
            const activeColorIdx = selectedColorMap[product.id] || 0;
            const isAdded = !!addedAnimation[product.id];

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between bg-white rounded-[5px] border border-stone-200/90 p-3 sm:p-3.5 hover:border-stone-400 hover:shadow-xl transition-all duration-300"
              >
                {/* ── Image Box with rounded-[5px] ── */}
                <div className="relative aspect-[3.6/4.3] w-full rounded-[5px] bg-[#F7F7F5] border border-stone-200/60 overflow-hidden mb-3 p-3 flex items-center justify-center">
                  <Link href={product.link} className="block relative w-full h-full">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      priority
                      unoptimized
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-contain object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </Link>

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={(e) => toggleWishlist(product.id, e)}
                    aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                    className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#F72585] border border-[#F72585] hover:text-[#F72585] hover:bg-white shadow-sm transition-all duration-200"
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125"
                      viewBox="0 0 24 24"
                      fill={isLiked ? "#F72585" : "none"}
                      stroke={isLiked ? "#F72585" : "currentColor"}
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
                    {/* Name */}
                    <Link
                      href={product.link}
                      className="font-body font-semibold text-[#0B0D0E] text-[13.5px] sm:text-[14.5px] md:text-[15px] leading-snug line-clamp-1 hover:text-[#F72585] transition-colors"
                    >
                      {product.name}
                    </Link>

                    {/* Price & Discount */}
                    <div className="flex items-center gap-2 mt-1.5 mb-3">
                      <span className="font-body font-black text-[#0B0D0E] text-[14.5px] sm:text-[16px]">
                        ₹{product.price}
                      </span>
                      <span className="font-body text-[#8B9196] text-[11.5px] sm:text-[12.5px] line-through">
                        ₹{product.originalPrice}
                      </span>
                      <span className="font-body font-bold text-[#F72585] text-[11px] sm:text-[12px] tracking-tight">
                        {product.discount}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Color Swatches with Space + Add to Cart Button */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 mt-auto">
                    {/* Color Swatches with Generous Spacing */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {product.colors.map((colorObj, cIdx) => {
                        const isSelectedColor = cIdx === activeColorIdx;
                        return (
                          <button
                            key={cIdx}
                            onClick={(e) => handleSelectColor(product.id, cIdx, e)}
                            aria-label={`Select color ${colorObj.name}`}
                            title={colorObj.name}
                            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full transition-all duration-200 cursor-pointer ${
                              isSelectedColor
                                ? "ring-2 ring-[#0B0D0E] ring-offset-2 scale-110 shadow-sm"
                                : "border border-stone-300 hover:scale-115 hover:border-stone-500 opacity-90 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: colorObj.hex }}
                          />
                        );
                      })}
                    </div>

                    {/* Add to Cart Icon Button */}
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      aria-label={`Add ${product.name} to cart`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                        isAdded
                          ? "bg-[#36B8C5] text-white scale-110 shadow-md"
                          : "bg-[#0B0D0E] hover:bg-[#F72585] text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                      }`}
                      title="Add to cart"
                    >
                      {isAdded ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
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
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/shop?filter=trending"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-[5px] border border-stone-300 font-body font-bold text-xs text-[#0B0D0E] hover:bg-black hover:text-white transition-colors"
          >
            <span>View All Most Loved Tees</span>
            <span>→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
