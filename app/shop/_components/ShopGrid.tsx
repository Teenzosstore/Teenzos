"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SHOP_CATEGORIES,
  ShopProduct,
  ShopCategory,
  productMatchesCategory,
} from "@/lib/shopProducts";
import ShopSidebarFilter from "./ShopSidebarFilter";
import ShopProductCard from "./ShopProductCard";
import ShopToolbar from "./ShopToolbar";
import ShopMobileDrawer from "./ShopMobileDrawer";
import PageLoader from "@/components/PageLoader";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/context/ToastContext";

const PRODUCTS_PER_PAGE = 12;

interface ShopGridProps {
  initialProducts?: any[];
  categories?: any[];
  selectedCategory?: string;
}

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL"];

const AVAILABLE_COLORS = [
  { name: "Black", hex: "#0B0D0E" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Hot Pink", hex: "#F72585" },
  { name: "Cyan", hex: "#36B8C5" },
  { name: "Grey", hex: "#9E9E9E" },
  { name: "Orange", hex: "#FF6B35" },
];

export default function ShopGrid({
  initialProducts = [],
  categories = [],
  selectedCategory: initialCategoryParam = "",
}: ShopGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Combine initial DB products with our rich catalogue of homepage & mockup streetwear products
  const allCatalogueProducts: ShopProduct[] = useMemo(() => {
    const existingIds = new Set<string>();
    const list: ShopProduct[] = [];

    // 1. First add real DB products (so newly created / edited products appear first and override any mockup)
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      initialProducts.forEach((p) => {
        if (!existingIds.has(p.id) && p.is_active !== false) {
          existingIds.add(p.id);
          list.push({
            id: p.id,
            slug: p.slug || p.id,
            name: p.name,
            category_id: p.category_id || "t-shirts",
            category_name:
              p.category_name ||
              categories.find((c) => c.id === p.category_id)?.name ||
              "Collection",
            price: Number(p.price || 999),
            oldPrice: Number(p.oldPrice || (p.price ? p.price * 1.25 : 1299)),
            discount: p.oldPrice
              ? `${Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)}% OFF`
              : "20% OFF",
            image_url: p.image_url || "/image.png",
            badge: p.badge || undefined,
            rating: Number(p.rating) || 0,
            review_count: Number(p.review_count) || 0,
            sizes: ["S", "M", "L", "XL"],
            in_stock: true,
            is_active: true,
            colors: p.colors || [{ name: "Black", hex: "#0B0D0E" }],
            description: p.description,
          });
        }
      });
    }


    return list;
  }, [initialProducts, categories]);

  // Active categories for the sidebar filter (synced with active products: curated badges only show when a product actually has them!)
  const filterCategories: ShopCategory[] = useMemo(() => {
    const allOption: ShopCategory = { id: "all", name: "All Products", icon: "grid" };

    const activeDbCategories = (categories || []).filter((c) => c.is_active !== false);
    const activeDbMap = new Map(activeDbCategories.map((c) => [c.id.toLowerCase(), c]));

    const categoryMeta: Record<string, { icon: string; badge?: string; description?: string }> = {
      men: { icon: "men", badge: "POPULAR", description: "Oversized & boxy streetwear fits" },
      women: { icon: "women", badge: "HOT", description: "Relaxed streetwear & crop graphics" },
      "new-arrivals": { icon: "sparkles", badge: "NEW", description: "Fresh drops dropped weekly" },
      bestseller: { icon: "flame", badge: "HOT", description: "Most popular streetwear fits" },
      trending: { icon: "trending", badge: "TRENDING", description: "Viral fits setting the wave" },
      exclusive: { icon: "tag", badge: "EXCLUSIVE", description: "Limited edition 1-of-1 drops" },
      hoodies: { icon: "hoodie" },
      "t-shirts": { icon: "tshirt" },
      sweatshirts: { icon: "sweatshirt" },
      jackets: { icon: "jacket" },
      bottoms: { icon: "bottoms" },
      accessories: { icon: "accessories" },
    };

    const filteredList: ShopCategory[] = [allOption];

    // Curated badge categories: ONLY include in the filter IF at least 1 active product has this badge or collection!
    const curatedKeys = [
      { id: "new-arrivals", name: "New Arrivals", icon: "sparkles", badge: "NEW" },
      { id: "bestseller", name: "Hot Bestseller", icon: "flame", badge: "HOT" },
      { id: "trending", name: "Trending", icon: "trending", badge: "TRENDING" },
      { id: "exclusive", name: "Exclusive", icon: "tag", badge: "EXCLUSIVE" },
    ];

    curatedKeys.forEach((curated) => {
      // Check if any product actually has this badge or category assigned!
      const hasProduct = allCatalogueProducts.some((p) =>
        productMatchesCategory(p, curated.id)
      );

      if (hasProduct) {
        const dbCat = activeDbMap.get(curated.id);
        filteredList.push({
          id: curated.id,
          name: dbCat?.name || curated.name,
          icon: curated.icon,
          badge: curated.badge,
          description: dbCat?.description || categoryMeta[curated.id]?.description,
        });
      }
    });

    // Apparel & Gender categories
    const standardApparelOrder = [
      "men",
      "women",
      "hoodies",
      "t-shirts",
      "sweatshirts",
      "jackets",
      "bottoms",
      "accessories",
    ];

    const processedIds = new Set<string>(["new-arrivals", "bestseller", "trending", "exclusive"]);

    standardApparelOrder.forEach((id) => {
      const dbCat = activeDbMap.get(id);
      const hasProduct = allCatalogueProducts.some((p) =>
        productMatchesCategory(p, id)
      );
      if ((dbCat && dbCat.is_active !== false) || (!categories.length && hasProduct)) {
        processedIds.add(id);
        const meta = categoryMeta[id] || { icon: "grid" };
        filteredList.push({
          id: dbCat?.id || id,
          name: dbCat?.name || (id === "t-shirts" ? "T-Shirts" : id.charAt(0).toUpperCase() + id.slice(1)),
          icon: meta.icon,
          badge: meta.badge,
          description: dbCat?.description || meta.description,
        });
      }
    });

    // Any custom categories created in admin
    activeDbCategories.forEach((dbCat) => {
      const id = dbCat.id.toLowerCase();
      if (!processedIds.has(id)) {
        processedIds.add(id);
        const meta = categoryMeta[id] || { icon: "grid" };
        filteredList.push({
          id: dbCat.id,
          name: dbCat.name,
          icon: meta.icon,
          badge: meta.badge,
          description: dbCat.description,
        });
      }
    });

    return filteredList;
  }, [allCatalogueProducts, categories]);

  // Read URL params
  const categoryQuery = searchParams.get("category") || initialCategoryParam || "all";
  const filterQuery = searchParams.get("filter") || "";
  const genderQuery = searchParams.get("gender") || "";
  const featuredQuery = searchParams.get("featured") === "true";
  const searchQuery = searchParams.get("search") || "";

  // Normalize any query parameter into a single category identifier
  const getInitialCategory = () => {
    if (genderQuery === "men" || categoryQuery === "men") return "men";
    if (genderQuery === "women" || categoryQuery === "women") return "women";
    if (
      featuredQuery ||
      filterQuery === "new" ||
      filterQuery === "new-arrivals" ||
      categoryQuery === "new-arrivals" ||
      categoryQuery === "new-drops"
    ) {
      return "new-arrivals";
    }
    if (
      filterQuery === "bestseller" ||
      filterQuery === "best-sellers" ||
      categoryQuery === "bestseller" ||
      categoryQuery === "best-sellers"
    ) {
      return "bestseller";
    }
    if (filterQuery === "trending" || categoryQuery === "trending") {
      return "trending";
    }
    if (
      filterQuery === "exclusive" ||
      categoryQuery === "exclusive" ||
      categoryQuery === "limited-edition"
    ) {
      return "exclusive";
    }
    if (categoryQuery && categoryQuery !== "all") {
      if (categoryQuery.includes("oversize") || categoryQuery === "acid-wash") {
        return "t-shirts";
      }
      if (categoryQuery === "streetwear-collection") {
        return "hoodies";
      }
      if (SHOP_CATEGORIES.some((c) => c.id === categoryQuery)) {
        return categoryQuery;
      }
    }
    return "all";
  };

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(getInitialCategory);
  const [priceMax, setPriceMax] = useState<number>(3499);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid4" | "grid3" | "grid2" | "list">("grid4");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  // Filter loading state for right-side product area
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setCurrentPage(1);
    setIsFilterLoading(true);
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      setIsFilterLoading(false);
    }, 450);

    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, [
    selectedCategory,
    priceMax,
    selectedSizes,
    selectedColors,
    inStockOnly,
    sortBy,
    searchQuery,
  ]);

  // Sync category state when URL changes
  useEffect(() => {
    const effective = getInitialCategory();
    setSelectedCategory(effective);
  }, [categoryQuery, filterQuery, genderQuery, featuredQuery]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === "all") {
      router.push("/shop", { scroll: false });
    } else {
      router.push(`/shop?category=${catId}`, { scroll: false });
    }
  };

  // Wishlist local persistence
  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem("teenzos_wishlist");
        if (saved) setWishlist(JSON.parse(saved));
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

      const found = allCatalogueProducts.find((p) => p.id === id);
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

      setWishlist({ ...currentMap });

      setTimeout(() => {
        window.dispatchEvent(new Event("teenzos-wishlist-change"));
      }, 0);

      if (nextVal) {
        showToast("Saved to wishlist!", "success");
      } else {
        showToast("Removed from wishlist", "info");
      }
    } catch (e) {
      console.error("Wishlist error in ShopGrid:", e);
    }
  };

  // Toggle Size
  const handleToggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Toggle Color
  const handleToggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName)
        ? prev.filter((c) => c !== colorName)
        : [...prev, colorName]
    );
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory("all");
    setPriceMax(3499);
    setSelectedSizes([]);
    setSelectedColors([]);
    setInStockOnly(false);
    setSortBy("newest");
    setCurrentPage(1);
    router.push("/shop", { scroll: false });
  };

  // Count active filters
  const hasActiveFilters =
    selectedCategory !== "all" ||
    priceMax < 3499 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    inStockOnly;

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (priceMax < 3499 ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    (inStockOnly ? 1 : 0);

  // Category counts calculation using productMatchesCategory
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allCatalogueProducts.length };
    filterCategories.forEach((cat) => {
      if (cat.id !== "all") {
        counts[cat.id] = allCatalogueProducts.filter((p) =>
          productMatchesCategory(p, cat.id)
        ).length;
      }
    });
    return counts;
  }, [allCatalogueProducts, filterCategories]);

  // In stock count
  const inStockCount = useMemo(() => {
    return allCatalogueProducts.filter((p) => p.in_stock).length;
  }, [allCatalogueProducts]);

  // Main Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return allCatalogueProducts
      .filter((p) => {
        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCategory = p.category_name.toLowerCase().includes(q);
          if (!matchName && !matchCategory) return false;
        }

        // Category filter (Handles Men, Women, New Arrivals, Hot Bestseller, Trending, Exclusive, Hoodies, etc.)
        if (selectedCategory !== "all") {
          if (!productMatchesCategory(p, selectedCategory)) {
            return false;
          }
        }

        // Price filter
        if (p.price > priceMax) {
          return false;
        }

        // Size filter
        if (selectedSizes.length > 0) {
          const hasSize = p.sizes.some((s) => selectedSizes.includes(s));
          if (!hasSize) return false;
        }

        // Color filter
        if (selectedColors.length > 0) {
          const hasColor = p.colors?.some((c) =>
            selectedColors.some(
              (sel) => sel.toLowerCase() === c.name.toLowerCase()
            )
          );
          if (!hasColor) return false;
        }

        // In Stock filter
        if (inStockOnly && !p.in_stock) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-asc":
            return a.price - b.price;
          case "price-desc":
            return b.price - a.price;
          case "rating":
            return b.rating - a.rating;
          case "discount": {
            const discA = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
            const discB = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
            return discB - discA;
          }
          case "newest":
          default:
            return 0; // maintain curated order
        }
      });
  }, [
    allCatalogueProducts,
    searchQuery,
    selectedCategory,
    priceMax,
    selectedSizes,
    selectedColors,
    inStockOnly,
    sortBy,
  ]);

  const currentCategory = filterCategories.find((c) => c.id === selectedCategory) || SHOP_CATEGORIES.find((c) => c.id === selectedCategory);
  const currentCategoryName = currentCategory?.name || "All Products";

  // ── Pagination Computations ──
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);

    if (typeof window !== "undefined") {
      const topEl = document.getElementById("shop-products-top");
      if (topEl) {
        topEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 380, behavior: "smooth" });
      }
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage === 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="w-full">
      {/* ── Toolbar Bar (Breadcrumbs, Counts, Sort, View Modes) ── */}
      <ShopToolbar
        currentCategoryName={currentCategoryName}
        totalProducts={allCatalogueProducts.length}
        filteredProductsCount={filteredProducts.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenMobileFilter={() => setIsMobileDrawerOpen(true)}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* ── Main Layout: Sidebar (Desktop) + Products Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 pt-6 sm:pt-8 items-start">
        {/* Left Sticky Sidebar (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-[120px] space-y-4">
          <ShopSidebarFilter
            categories={filterCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            categoryCounts={categoryCounts}
            priceRange={[499, priceMax]}
            onPriceChange={(newMax) => setPriceMax(newMax)}
            minPriceLimit={499}
            maxPriceLimit={3499}
            availableSizes={AVAILABLE_SIZES}
            selectedSizes={selectedSizes}
            onToggleSize={handleToggleSize}
            availableColors={AVAILABLE_COLORS}
            selectedColors={selectedColors}
            onToggleColor={handleToggleColor}
            inStockOnly={inStockOnly}
            onToggleInStock={setInStockOnly}
            inStockCount={inStockCount}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </aside>

        {/* Right Main Grid Area */}
        <div id="shop-products-top" className="lg:col-span-3 w-full scroll-mt-28">
          {/* Category Banner when a category is selected */}
          {selectedCategory !== "all" && currentCategory && (
            <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-[5px] bg-white border border-stone-200/90 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[5px] bg-[#FFE1ED] text-[#F72585] flex items-center justify-center shrink-0 font-display font-extrabold text-xs uppercase">
                  {currentCategory.badge || currentCategory.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-sm sm:text-base text-[#0B0D0E] uppercase tracking-wide truncate">
                      {currentCategory.name}
                    </h2>
                    {currentCategory.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider shrink-0 ${
                          currentCategory.badge === "HOT"
                            ? "bg-[#F72585] text-white"
                            : currentCategory.badge === "TRENDING"
                            ? "bg-[#36B8C5] text-white"
                            : currentCategory.badge === "EXCLUSIVE"
                            ? "bg-[#9B51E0] text-white"
                            : "bg-[#FFE1ED] text-[#F72585]"
                        }`}
                      >
                        {currentCategory.badge}
                      </span>
                    )}
                  </div>
                  {currentCategory.description && (
                    <p className="text-[11px] sm:text-xs text-stone-500 truncate mt-0.5">
                      {currentCategory.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] sm:text-xs font-bold text-[#F72585] bg-[#FFE1ED] px-2.5 py-1 rounded-[4px]">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
                </span>
                <button
                  onClick={() => handleSelectCategory("all")}
                  className="text-xs font-bold text-stone-600 hover:text-black hover:underline hidden sm:inline-block ml-1"
                >
                  View All
                </button>
              </div>
            </div>
          )}

          {/* Active Filter Tags Row (if any) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-stone-500">
                Filters applied:
              </span>

              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFE1ED] text-[#F72585]">
                  Category: {currentCategoryName}
                  <button
                    onClick={() => handleSelectCategory("all")}
                    className="hover:text-black ml-0.5"
                  >
                    ×
                  </button>
                </span>
              )}

              {priceMax < 3499 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFE1ED] text-[#F72585]">
                  Max: ₹{priceMax.toLocaleString("en-IN")}
                  <button
                    onClick={() => setPriceMax(3499)}
                    className="hover:text-black ml-0.5"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedSizes.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-800"
                >
                  Size: {s}
                  <button
                    onClick={() => handleToggleSize(s)}
                    className="hover:text-black ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              {selectedColors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-800"
                >
                  Color: {c}
                  <button
                    onClick={() => handleToggleColor(c)}
                    className="hover:text-black ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#F72585] hover:underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Main Products Grid Area with Filter Loader */}
          {isFilterLoading ? (
            <div className="w-full min-h-[380px] sm:min-h-[480px] bg-white/70 backdrop-blur-[4px] rounded-2xl border border-stone-200/80 flex items-center justify-center p-6 sm:p-12 transition-all animate-fade-in shadow-xs">
              <PageLoader fullScreen={false} text="Loading..." />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="w-full bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-14 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#FFE1ED] text-[#F72585] flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-2xl uppercase tracking-wide text-[#0B0D0E]">
                No Streetwear Found
              </h3>
              <p className="text-stone-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                We couldn&apos;t find any pieces matching your current filters. Try
                broadening your search or clearing applied filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 px-6 py-3 rounded-full bg-[#0B0D0E] hover:bg-[#F72585] text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === "list" ? (
            /* ── List Layout ── */
            <div className="flex flex-col gap-4 animate-fade-in">
              {paginatedProducts.map((product) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  viewMode="list"
                  isWishlisted={!!wishlist[product.id]}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          ) : (
            /* ── Grid Layout (Wider cards: 2 Cols Mobile, 2/3 Cols Tablet, 3 Cols Desktop) ── */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in">
              {paginatedProducts.map((product) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  viewMode="grid4"
                  isWishlisted={!!wishlist[product.id]}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          )}

          {/* ── Modern Transparent Streetwear Pagination (No Container Background) ── */}
          {!isFilterLoading && totalPages > 1 && (
            <div className="mt-8 sm:mt-12 pt-6 border-t border-stone-200/80 flex items-center justify-center select-none bg-transparent">
              <nav
                aria-label="Shop Catalog Pagination"
                className="flex items-center justify-center gap-1.5 sm:gap-2.5 bg-transparent"
              >
                {/* Prev Arrow (Modern Minimal Bordered Button) */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-200 bg-white text-[#0B0D0E] hover:border-[#0B0D0E] hover:bg-[#0B0D0E] hover:text-white active:scale-90 transition-all duration-200 flex items-center justify-center shadow-2xs disabled:opacity-20 disabled:hover:border-stone-200 disabled:hover:bg-white disabled:hover:text-[#0B0D0E] disabled:cursor-not-allowed cursor-pointer shrink-0"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 sm:gap-1.5 font-body">
                  {getPageNumbers().map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="w-6 h-8 sm:h-9 flex items-center justify-center text-xs sm:text-sm font-semibold text-stone-400 select-none tracking-widest"
                        >
                          ...
                        </span>
                      );
                    }
                    const pageNum = Number(p);
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-[#0B0D0E] text-white font-bold shadow-md scale-105"
                            : "bg-transparent text-stone-700 font-semibold hover:text-[#0B0D0E] hover:bg-stone-100 active:scale-95"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Arrow (Modern Minimal Bordered Button) */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-200 bg-white text-[#0B0D0E] hover:border-[#0B0D0E] hover:bg-[#0B0D0E] hover:text-white active:scale-90 transition-all duration-200 flex items-center justify-center shadow-2xs disabled:opacity-20 disabled:hover:border-stone-200 disabled:hover:bg-white disabled:hover:text-[#0B0D0E] disabled:cursor-not-allowed cursor-pointer shrink-0"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Filter Slide-out Drawer ── */}
      <ShopMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        filteredCount={filteredProducts.length}
        totalCount={allCatalogueProducts.length}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <ShopSidebarFilter
          categories={filterCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            handleSelectCategory(catId);
            setIsMobileDrawerOpen(false);
          }}
          categoryCounts={categoryCounts}
          priceRange={[499, priceMax]}
          onPriceChange={(newMax) => setPriceMax(newMax)}
          minPriceLimit={499}
          maxPriceLimit={3499}
          availableSizes={AVAILABLE_SIZES}
          selectedSizes={selectedSizes}
          onToggleSize={handleToggleSize}
          availableColors={AVAILABLE_COLORS}
          selectedColors={selectedColors}
          onToggleColor={handleToggleColor}
          inStockOnly={inStockOnly}
          onToggleInStock={setInStockOnly}
          inStockCount={inStockCount}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </ShopMobileDrawer>
    </div>
  );
}
