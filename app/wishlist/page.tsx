"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import { Trash2, ShoppingCart, ArrowRight, Heart, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { SHOP_PRODUCTS, ShopProduct, slugify } from "@/lib/shopProducts";
import { productLoaderFor } from "@/lib/imagekitImage";
import TrendingProductCard from "@/components/TrendingProductCard";
import { createClient } from "@/lib/supabase/client";

export default function WishlistPage() {
  const [wishlistMap, setWishlistMap] = useState<Record<string, boolean>>({});
  const [cachedProductsMap, setCachedProductsMap] = useState<Record<string, ShopProduct>>({});
  const [dbProducts, setDbProducts] = useState<ShopProduct[]>([]);
  const [selectedColorMap, setSelectedColorMap] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Load wishlist and cached products from localStorage on mount & listen to cross-component updates
  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem("teenzos_wishlist");
        if (saved) {
          const parsed = JSON.parse(saved);
          // Filter out falsy entries
          const clean: Record<string, boolean> = {};
          Object.keys(parsed).forEach((k) => {
            if (parsed[k]) clean[k] = true;
          });
          setWishlistMap(clean);
        } else {
          setWishlistMap({});
        }

        const cachedRaw = localStorage.getItem("teenzos_wishlist_products");
        if (cachedRaw) {
          setCachedProductsMap(JSON.parse(cachedRaw));
        } else {
          setCachedProductsMap({});
        }
      } catch (e) {
        console.error("Failed to load wishlist", e);
      }
      setIsLoaded(true);
    };

    loadWishlist();

    const handleStorageChange = () => loadWishlist();
    window.addEventListener("teenzos-wishlist-change", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("teenzos-wishlist-change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fetch live products from Supabase to ensure DB items are resolved and recommend drops
  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select(`
            id, name, slug, category_id, is_featured, is_active, badge, rating, review_count, color_name, price, "oldPrice", featured_image_url,
            product_images ( image_url ),
            product_variants ( id, variant_name, price, original_price, stock_quantity, is_active )
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          const formatted: ShopProduct[] = data.map((p: any) => {
            const price = Number(p.price || 999);
            const oldPrice = Number(p.oldPrice || Math.round(price * 1.25));
            const discount =
              p.oldPrice && p.oldPrice > price
                ? `${Math.round(((p.oldPrice - price) / p.oldPrice) * 100)}% OFF`
                : "20% OFF";

            return {
              id: p.id,
              slug: p.slug || p.id,
              name: p.name,
              category_id: p.category_id || "t-shirts",
              category_name: "Streetwear",
              price,
              oldPrice,
              discount,
              image_url: p.featured_image_url || p.product_images?.[0]?.image_url || "/image.png",
              badge: p.badge || undefined,
              rating: Number(p.rating) || 0,
              review_count: Number(p.review_count) || 0,
              sizes: ["S", "M", "L", "XL"],
              in_stock: true,
              is_active: true,
              colors: [],
              color_name: p.color_name,
              product_images: p.product_images,
              gallery_images: (p.product_images || []).map((img: any) => img.image_url),
              product_variants: p.product_variants,
            };
          });
          setDbProducts(formatted);
        }
      } catch (err) {
        console.warn("Could not fetch DB products for wishlist page:", err);
      }
    };

    fetchDbProducts();
  }, []);

  // Filter products that are in wishlist (supporting static catalog, localStorage cache, and dynamic DB products)
  const wishlistedProducts: ShopProduct[] = useMemo(() => {
    const list: ShopProduct[] = [];
    const foundIds = new Set<string>();

    // 1. Check wishlisted items in static catalog
    SHOP_PRODUCTS.forEach((p) => {
      if (wishlistMap[p.id]) {
        list.push(p);
        foundIds.add(p.id);
      }
    });

    // 2. Check wishlisted items in localStorage cache
    Object.keys(wishlistMap).forEach((id) => {
      if (wishlistMap[id] && !foundIds.has(id) && cachedProductsMap[id]) {
        list.push(cachedProductsMap[id]);
        foundIds.add(id);
      }
    });

    // 3. Check wishlisted items in live DB products
    dbProducts.forEach((p) => {
      if (wishlistMap[p.id] && !foundIds.has(p.id)) {
        list.push(p);
        foundIds.add(p.id);
      }
    });

    return list;
  }, [wishlistMap, cachedProductsMap, dbProducts]);

  // Remove single product from wishlist
  const handleRemoveFromWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = { ...wishlistMap };
    delete next[productId];
    setWishlistMap(next);

    try {
      localStorage.setItem("teenzos_wishlist", JSON.stringify(next));

      // Also clean up from cached products
      const nextCached = { ...cachedProductsMap };
      delete nextCached[productId];
      setCachedProductsMap(nextCached);
      localStorage.setItem("teenzos_wishlist_products", JSON.stringify(nextCached));

      window.dispatchEvent(new Event("teenzos-wishlist-change"));
    } catch (err) {
      console.error(err);
    }

    showToast("Removed from wishlist", "info");
  };

  // Clear all wishlist items
  const handleClearAll = () => {
    setWishlistMap({});
    setCachedProductsMap({});
    try {
      localStorage.removeItem("teenzos_wishlist");
      localStorage.removeItem("teenzos_wishlist_products");
      window.dispatchEvent(new Event("teenzos-wishlist-change"));
    } catch (err) {
      console.error(err);
    }
    showToast("Wishlist cleared", "info");
  };

  // Select color for a product
  const handleSelectColor = (productId: string, colorIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorMap((prev) => ({ ...prev, [productId]: colorIdx }));
  };

  // Move product to cart
  const handleAddToCart = (product: ShopProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const activeColorIdx = selectedColorMap[product.id] || 0;
    const selectedColor =
      product.colors && product.colors.length > 0
        ? product.colors[activeColorIdx]?.name
        : "Standard";

    addToCart(
      {
        id: product.id,
        name: `${product.name}${selectedColor && selectedColor !== "Standard" ? ` (${selectedColor})` : ""}`,
        price: product.price,
        image_url: product.image_url,
        category_name: product.category_name || "Streetwear",
        variant_name: selectedColor || product.sizes?.[0] || "Standard",
      },
      {
        event: e,
        sourceElement: e.currentTarget as HTMLElement,
      }
    );

    showToast(`Added ${product.name} to cart!`, "success");
  };

  // Recommended products for "Trending For You" section
  const recommendedProducts = useMemo(() => {
    if (dbProducts.length > 0) {
      return dbProducts.slice(0, 5);
    }
    return SHOP_PRODUCTS.slice(0, 5);
  }, [dbProducts]);

  // Handle wishlist toggle from Trending Product Card
  const handleToggleWishlistFromCard = (id: string) => {
    const isCurrentlyLiked = !!wishlistMap[id];
    const nextVal = !isCurrentlyLiked;
    const next = { ...wishlistMap };
    if (nextVal) {
      next[id] = true;
    } else {
      delete next[id];
    }
    setWishlistMap(next);

    try {
      localStorage.setItem("teenzos_wishlist", JSON.stringify(next));

      const found = recommendedProducts.find((p) => p.id === id) || dbProducts.find((p) => p.id === id);
      const nextCached = { ...cachedProductsMap };
      if (nextVal && found) {
        nextCached[id] = found;
      } else if (!nextVal) {
        delete nextCached[id];
      }
      setCachedProductsMap(nextCached);
      localStorage.setItem("teenzos_wishlist_products", JSON.stringify(nextCached));

      window.dispatchEvent(new Event("teenzos-wishlist-change"));
    } catch (err) {
      console.error(err);
    }

    if (nextVal) {
      showToast("Saved to wishlist!", "success");
    } else {
      showToast("Removed from wishlist", "info");
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F7F7F6] pt-[104px] md:pt-[116px]">
        {/* ── Streetwear Graffiti Hero Banner (About Us Style) ── */}
        <PageHeroBanner title="MY WISHLIST" subtitle="YOUR SAVED DROPS" />

        <div className="max-w-[1400px] mx-auto px-3.5 sm:px-6 md:px-8 lg:px-10 py-7 sm:py-10">
          {/* Subheader Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="font-body font-bold text-sm sm:text-base text-[#0B0D0E]">
                Saved Items
              </span>
              <span className="bg-[#FFE1ED] text-[#F72585] text-xs font-black px-2.5 py-0.5 rounded-full">
                {wishlistedProducts.length}
              </span>
            </div>

            {wishlistedProducts.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-stone-500 hover:text-red-500 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Loading state */}
          {!isLoaded ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#F72585] animate-spin" />
            </div>
          ) : wishlistedProducts.length > 0 ? (
            /* ── Wishlist Products Grid (2 cols on mobile, 3 tablet, 5 desktop) ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {wishlistedProducts.map((product) => {
                const productHref = `/shop/${product.slug || slugify(product.name) || product.id}`;
                const activeColorIdx = selectedColorMap[product.id] || 0;

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between bg-white rounded-[5px] border border-stone-200/90 p-2.5 sm:p-3 hover:border-stone-400 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Image Box */}
                    <div className="relative aspect-[4.3/4.3] w-full rounded-[5px] bg-[#F7F7F5] border border-stone-200/60 overflow-hidden mb-2.5 sm:mb-3 flex items-center justify-center">
                      <Link href={productHref} className="block relative w-full h-full">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          loader={productLoaderFor(product.image_url)}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-contain object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
                          onError={(e) => {
                            e.currentTarget.src = "/image.png";
                          }}
                        />
                      </Link>

                      {/* Badge if present */}
                      {product.badge && (
                        <span className="absolute top-2 left-2 z-10 bg-[#FFF0F6] text-[#FF007A] text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px] border border-[#FF007A]/15 shadow-sm pointer-events-none">
                          {product.badge}
                        </span>
                      )}

                      {/* ── DELETE ICON BUTTON (In place of Wishlist Heart) ── */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFromWishlist(product.id, e)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        title="Remove from wishlist"
                        className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-200/80 shadow-sm transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors" />
                      </button>
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col flex-grow justify-between gap-2 px-0.5">
                      <div>
                        {/* Name */}
                        <Link
                          href={productHref}
                          className="font-body font-semibold text-[#0B0D0E] text-[13px] sm:text-[14px] md:text-[14.5px] leading-snug line-clamp-1 hover:text-[#F72585] transition-colors"
                        >
                          {product.name}
                        </Link>

                        {/* Price & Discount */}
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 mb-2 flex-wrap">
                          <span className="font-body font-black text-[#0B0D0E] text-[14px] sm:text-[15.5px]">
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                          {product.oldPrice && (
                            <span className="font-body text-[#8B9196] text-[11px] sm:text-[12px] line-through">
                              ₹{product.oldPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                          {product.discount && (
                            <span className="font-body font-bold text-[#F72585] text-[10.5px] sm:text-[11.5px] tracking-tight">
                              {product.discount}
                            </span>
                          )}
                        </div>

                        {/* ── Color Swatches Option ── */}
                        <div className="flex items-center gap-1.5 sm:gap-2 py-1.5 border-t border-stone-100 my-1 pl-[5px]">
                          {product.colors && product.colors.length > 0 ? (
                            product.colors.map((colorObj, cIdx) => {
                              const isSelected = cIdx === activeColorIdx;
                              return (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={(e) => handleSelectColor(product.id, cIdx, e)}
                                  aria-label={`Select color ${colorObj.name}`}
                                  title={colorObj.name}
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 cursor-pointer ${
                                    isSelected
                                      ? "ring-2 ring-[#0B0D0E] ring-offset-1 scale-110 shadow-sm"
                                      : "border border-stone-300 hover:scale-115 hover:border-stone-500 opacity-85 hover:opacity-100"
                                  }`}
                                  style={{ backgroundColor: colorObj.hex }}
                                />
                              );
                            })
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-[#0B0D0E]" />
                          )}
                        </div>
                      </div>

                      {/* Move to Bag Action Button */}
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(product, e)}
                        className="w-full py-2 px-3 rounded-[5px] bg-[#0B0D0E] hover:bg-[#F72585] text-white font-body font-bold text-[11px] sm:text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer mt-1"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Modern Streetwear Empty State ── */
            <div className="py-12 sm:py-16 text-center max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center mx-auto mb-4 text-[#F72585]">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-stone-300 stroke-[1.5]" />
              </div>

              <h2 className="font-display font-[350] text-2xl sm:text-3xl text-[#0B0D0E] tracking-tight uppercase">
                YOUR WISHLIST IS EMPTY
              </h2>

              <p className="text-stone-500 text-xs sm:text-sm mt-2 mb-6">
                You haven&apos;t saved any streetwear drops yet. Explore our newest collections and tap the heart icon on any product to save it here.
              </p>

              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[5px] bg-[#0B0D0E] hover:bg-[#F72585] text-white font-body font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                <span>EXPLORE COLLECTION</span>
                <span>→</span>
              </Link>
            </div>
          )}

          {/* ── Trending For You Drops Section ── */}
          {recommendedProducts.length > 0 && (
            <div className="mt-14 pt-10 border-t border-stone-200">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#F72585]" />
                  <h3 className="font-display font-[350] text-xl sm:text-2xl text-[#0B0D0E] uppercase tracking-tight">
                    TRENDING FOR YOU
                  </h3>
                </div>
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-1.5 font-body font-bold text-xs sm:text-sm text-[#0B0D0E] hover:text-[#F72585] transition-colors"
                >
                  <span>View All</span>
                  <span className="transform group-hover:translate-x-1 transition-transform duration-200 text-sm leading-none">
                    →
                  </span>
                </Link>
              </div>

              {/* Same responsive grid as Home Page: 2 cols on mobile, 3 cols on tablet, 5 cols on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {recommendedProducts.map((product) => (
                  <TrendingProductCard
                    key={product.id}
                    product={product}
                    isLiked={!!wishlistMap[product.id]}
                    onToggleWishlist={handleToggleWishlistFromCard}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
