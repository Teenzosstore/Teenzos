"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import {
  ShopProduct,
  productMatchesCategory,
} from "@/lib/shopProducts";
import { productLoaderFor } from "@/lib/imagekitImage";
import TrendingProductCard from "./TrendingProductCard";

// ==========================================
// FILTER TABS (Clean category labels from shop - without counts & badges)
// ==========================================

const FILTER_TABS = [
  { id: "all", label: "ALL" },
  { id: "new-arrivals", label: "NEW ARRIVALS" },
  { id: "bestseller", label: "HOT BESTSELLER" },
  { id: "trending", label: "TRENDING" },
  { id: "exclusive", label: "EXCLUSIVE" },
];

interface TrendingNowProps {
  initialProducts?: any[];
}

export default function TrendingNow({ initialProducts = [] }: TrendingNowProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [visibleCount, setVisibleCount] = useState(8);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [selectedColorMap, setSelectedColorMap] = useState<Record<string, number>>({});
  const [addedAnimation, setAddedAnimation] = useState<Record<string, boolean>>({});

  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Combine active DB products with shop catalogue (DB takes first precedence)
  const allProducts: ShopProduct[] = useMemo(() => {
    const existingIds = new Set<string>();
    const list: ShopProduct[] = [];

    // 1. First include live Supabase DB products
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      initialProducts.forEach((p) => {
        if (!existingIds.has(p.id) && p.is_active !== false) {
          existingIds.add(p.id);
          const price = Number(p.price || 999);
          const oldPrice = Number(p.oldPrice || p.sale_price || Math.round(price * 1.25));
          const discount = p.discount || (oldPrice > price ? `${Math.round(((oldPrice - price) / oldPrice) * 100)}% OFF` : "20% OFF");
          
          list.push({
            id: p.id,
            slug: p.slug || p.id,
            name: p.name,
            category_id: p.category_id || "t-shirts",
            category_name: p.category_name || "Streetwear",
            price,
            oldPrice,
            discount,
            image_url: p.image_url || p.featured_image_url || "/image.png",
            badge: p.badge || undefined,
            rating: Number(p.rating) || 0,
            review_count: Number(p.review_count) || 0,
            sizes: p.sizes || ["S", "M", "L", "XL"],
            in_stock: true,
            is_active: true,
            colors: p.colors || [],
            color_name: p.color_name,
            product_images: p.product_images,
            gallery_images: p.gallery_images,
            product_variants: p.product_variants,
            description: p.description,
          });
        }
      });
    }


    return list;
  }, [initialProducts]);

  const allFilteredProducts = useMemo(() => {
    if (!activeTab || activeTab === "all") return allProducts;

    return allProducts.filter((p) => {
      const b = (p.badge || "").toLowerCase().trim();
      const tab = activeTab.toLowerCase().trim();

      if (tab === "new-arrivals") {
        return b.includes("new") || p.curated_category === "new-arrivals" || p.category_id === "new-arrivals";
      }
      if (tab === "bestseller") {
        return b.includes("best") || b.includes("hot") || p.curated_category === "bestseller" || p.category_id === "bestseller";
      }
      if (tab === "trending") {
        return b.includes("trend") || b.includes("fire") || p.curated_category === "trending" || p.category_id === "trending";
      }
      if (tab === "exclusive") {
        return b.includes("exclus") || b.includes("limit") || p.curated_category === "exclusive" || p.category_id === "exclusive";
      }

      return productMatchesCategory(p, activeTab);
    });
  }, [allProducts, activeTab]);

  const visibleProducts = useMemo(() => {
    return allFilteredProducts.slice(0, visibleCount);
  }, [allFilteredProducts, visibleCount]);

  const hasMore = visibleCount < allFilteredProducts.length;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setVisibleCount(8);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  // Wishlist local persistence (exact same as Shop page)
  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem("teenzos_wishlist");
        if (saved) setWishlist(JSON.parse(saved));
        else setWishlist({});
      } catch (e) {}
    };

    loadWishlist();
    window.addEventListener("teenzos-wishlist-change", loadWishlist);
    window.addEventListener("storage", loadWishlist);
    return () => {
      window.removeEventListener("teenzos-wishlist-change", loadWishlist);
      window.removeEventListener("storage", loadWishlist);
    };
  }, []);

  const toggleWishlist = (id: string) => {
    try {
      let currentMap: Record<string, boolean> = {};
      const saved = localStorage.getItem("teenzos_wishlist");
      if (saved) {
        try {
          currentMap = JSON.parse(saved);
        } catch {}
      }

      const nextVal = !currentMap[id];
      currentMap[id] = nextVal;
      localStorage.setItem("teenzos_wishlist", JSON.stringify(currentMap));

      // Cache product for Wishlist page
      const found = allProducts.find((p) => p.id === id);
      if (found) {
        let cachedProducts: Record<string, any> = {};
        try {
          const raw = localStorage.getItem("teenzos_wishlist_products");
          if (raw) cachedProducts = JSON.parse(raw);
        } catch {}
        if (nextVal) {
          cachedProducts[id] = found;
        } else {
          delete cachedProducts[id];
        }
        localStorage.setItem("teenzos_wishlist_products", JSON.stringify(cachedProducts));
      }

      // Update state immediately
      setWishlist({ ...currentMap });

      // Notify Header & other components asynchronously so React doesn't trigger setState-in-render conflict
      setTimeout(() => {
        window.dispatchEvent(new Event("teenzos-wishlist-change"));
      }, 0);

      if (nextVal) {
        showToast("Saved to wishlist!", "success");
      } else {
        showToast("Removed from wishlist", "info");
      }
    } catch (e) {
      console.error("Wishlist toggle error:", e);
    }
  };

  const handleSelectColor = (productId: string, colorIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorMap((prev) => ({ ...prev, [productId]: colorIdx }));
  };

  const handleAddToCart = (product: ShopProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const selectedColor =
      product.colors && product.colors.length > 0
        ? product.colors[selectedColorMap[product.id] || 0]?.name
        : "Standard";

    addToCart(
      {
        id: product.id,
        name: `${product.name}${selectedColor && selectedColor !== "Standard" ? ` (${selectedColor})` : ""}`,
        price: product.price,
        image_url: product.image_url,
        category_name: product.category_name || "Streetwear",
        variant_name: selectedColor || "Standard",
      },
      {
        event: e,
        sourceElement: e.currentTarget as HTMLElement,
      }
    );

    setAddedAnimation((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [product.id]: false }));
    }, 1400);

    showToast(`Added ${product.name} to bag!`, "success");
  };

  return (
    <section
      id="trending-now"
      aria-label="Trending Now - Most Loved Tees"
      className="w-full bg-[#FFFFFF] py-8 sm:py-12 md:py-16 lg:py-20 select-none overflow-hidden"
    >
      <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        
        {/* ── Section Header & Filter Navigation ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5 mb-7 sm:mb-9">
          {/* Title Area */}
          <div className="flex flex-col">
            <span className="font-body font-medium text-[11px] sm:text-xs md:text-[13px] text-[#6B7073] tracking-[0.24em] uppercase mb-1.5 ml-0.5">
              TRENDING NOW
            </span>
            <h2 className="font-display font-[350] text-[#0B0D0E] text-2xl sm:text-3xl md:text-4xl lg:text-[42px] tracking-tight uppercase leading-none">
              MOST LOVED TEES
            </h2>
          </div>

          {/* Filter Pills (No counts, no badges - clean & responsive) */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 max-w-full scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap sm:flex-wrap">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-[5px] text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#0B0D0E] text-white shadow-sm"
                      : "bg-[#F1F1EF] text-[#6B7073] hover:bg-[#E8E8E6] hover:text-[#0B0D0E]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            {/* View All Action (Desktop) */}
            <Link
              href={activeTab === "all" ? "/shop" : `/shop?category=${activeTab}`}
              className="group hidden sm:inline-flex items-center gap-1.5 font-body font-bold text-xs sm:text-sm text-[#0B0D0E] hover:text-[#F72585] transition-colors ml-2 whitespace-nowrap"
            >
              <span>View All</span>
            </Link>
          </div>
        </div>

        {/* ── Products Grid: 2 columns on mobile, 3 on tablet, 4 large cards on desktop ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-9 lg:gap-x-6 lg:gap-y-11">
          {visibleProducts.map((product) => (
            <TrendingProductCard
              key={product.id}
              product={product}
              variant="large"
              isWishlisted={!!wishlist[product.id]}
              isLiked={!!wishlist[product.id]}
              onToggleWishlist={toggleWishlist}
            />
          ))}
        </div>

        {/* Load More Button & View All */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3">
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              className="inline-flex items-center justify-center gap-2 px-8 sm:px-12 py-3 sm:py-3.5 rounded-[5px] bg-[#0B0D0E] hover:bg-[#F72585] text-white font-body font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              <span>Load More</span>
              <span className="text-sm">↓</span>
            </button>
          )}

          {/* Mobile View All Button */}
          <div className="w-full text-center sm:hidden">
            <Link
              href={activeTab === "all" ? "/shop" : `/shop?category=${activeTab}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-[5px] border border-stone-300 font-body font-bold text-xs text-[#0B0D0E] hover:bg-black hover:text-white transition-colors"
            >
              <span>View All in Shop</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
