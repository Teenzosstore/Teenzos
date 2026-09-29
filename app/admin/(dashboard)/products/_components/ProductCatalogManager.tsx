"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  Package,
  Sparkles,
  Flame,
  TrendingUp,
  Tag,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Shirt,
  Info,
  SlidersHorizontal,
  X,
  Layers,
} from "lucide-react";
import { deleteProduct } from "@/actions/products";
import { useToast } from "@/context/ToastContext";

export interface ProductVariantData {
  id: string;
  variant_name: string;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  is_active?: boolean;
}

export interface ProductImageData {
  id?: string;
  image_url: string;
  sort_order?: number;
}

export interface FullProductData {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  price: number;
  oldPrice?: number | null;
  featured_image_url?: string | null;
  badge?: string | null;
  rating?: number | null;
  review_count?: number | null;
  sold_count?: string | null;
  is_active: boolean;
  is_featured?: boolean;
  description?: string | null;
  short_description?: any;
  color_name?: string | null;
  created_at: string;
  categories?: { id?: string; name: string } | null;
  product_variants?: ProductVariantData[];
  product_images?: ProductImageData[];
}

interface ProductCatalogManagerProps {
  initialProducts: FullProductData[];
  categories: { id: string; name: string }[];
}

function parseColors(colorField?: string | null): { name: string; hex: string }[] {
  if (!colorField) return [];
  try {
    if (colorField.startsWith("[")) {
      const parsed = JSON.parse(colorField);
      if (Array.isArray(parsed)) {
        return parsed.map((c: any) => ({
          name: typeof c === "string" ? c : c.name || "Standard",
          hex: typeof c === "object" && c.hex ? c.hex : "#0B0D0E",
        }));
      }
    }
  } catch (e) {}
  return colorField
    .split(",")
    .map((c) => ({ name: c.trim(), hex: "#0B0D0E" }))
    .filter((c) => c.name);
}

function formatSummary(shortDesc?: any): string {
  if (!shortDesc) return "";

  // If already an object
  if (typeof shortDesc === "object") {
    if (shortDesc.bio && typeof shortDesc.bio === "string") {
      return shortDesc.bio.trim();
    }
    if (Array.isArray(shortDesc.features) && shortDesc.features.length > 0) {
      return shortDesc.features.filter(Boolean).join(" • ");
    }
    if (Array.isArray(shortDesc) && shortDesc.length > 0) {
      return shortDesc.filter(Boolean).join(" • ");
    }
    return "";
  }

  // If string
  if (typeof shortDesc === "string") {
    const trimmed = shortDesc.trim();
    if (!trimmed) return "";

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "object" && parsed !== null) {
          if (parsed.bio && typeof parsed.bio === "string") {
            return parsed.bio.trim();
          }
          if (Array.isArray(parsed.features) && parsed.features.length > 0) {
            return parsed.features.filter(Boolean).join(" • ");
          }
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(Boolean).join(" • ");
          }
        }
        return "";
      } catch (e) {
        return trimmed;
      }
    }

    return trimmed;
  }

  return "";
}



export default function ProductCatalogManager({
  initialProducts = [],
  categories = [],
}: ProductCatalogManagerProps) {
  const { showToast } = useToast();
  const [productsList, setProductsList] = useState<FullProductData[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBadge, setSelectedBadge] = useState("all");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleExpand = (id: string) => {
    setExpandedProductId((prev) => (prev === id ? null : id));
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingId(id);
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res?.error) {
        showToast(`Failed to delete: ${res.error}`, "error");
        setIsDeletingId(null);
      } else {
        setProductsList((prev) => prev.filter((p) => p.id !== id));
        showToast(`Product "${name}" deleted successfully.`, "info");
        setIsDeletingId(null);
      }
    });
  };

  // Filtered catalogue
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSlug = p.slug?.toLowerCase().includes(q);
        const matchesCategory = p.categories?.name?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesSlug && !matchesCategory && !matchesDesc) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== "all") {
        if (
          p.category_id !== selectedCategory &&
          p.categories?.name?.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }
      }

      // 3. Badge Filter
      if (selectedBadge !== "all") {
        if (selectedBadge === "none") {
          if (p.badge) return false;
        } else {
          const badgeLower = (p.badge || "").toLowerCase().trim();
          if (selectedBadge === "new-arrivals" && !badgeLower.includes("new")) return false;
          if (selectedBadge === "bestseller" && !badgeLower.includes("hot") && !badgeLower.includes("best")) return false;
          if (selectedBadge === "trending" && !badgeLower.includes("trend")) return false;
          if (selectedBadge === "exclusive" && !badgeLower.includes("exclus") && !badgeLower.includes("limit")) return false;
        }
      }

      return true;
    });
  }, [productsList, searchQuery, selectedCategory, selectedBadge]);

  // Badge pill renderer
  const renderBadgePill = (badge?: string | null) => {
    if (!badge) return null;
    const b = badge.toLowerCase().trim();
    let colorClass = "bg-stone-100 text-stone-700 border-stone-200";
    let icon = null;

    if (b.includes("new")) {
      colorClass = "bg-[#FFE1ED] text-[#F72585] border-[#F72585]/30";
      icon = <Sparkles className="w-3 h-3 text-[#F72585]" />;
    } else if (b.includes("hot") || b.includes("best")) {
      colorClass = "bg-[#FFF0E3] text-[#F47B20] border-[#F47B20]/30";
      icon = <Flame className="w-3 h-3 text-[#F47B20]" />;
    } else if (b.includes("trend")) {
      colorClass = "bg-[#DDF6F8] text-[#0891B2] border-[#36B8C5]/30";
      icon = <TrendingUp className="w-3 h-3 text-[#0891B2]" />;
    } else if (b.includes("exclus") || b.includes("limit")) {
      colorClass = "bg-[#F3E8FF] text-[#9333EA] border-[#9333EA]/30";
      icon = <Tag className="w-3 h-3 text-[#9333EA]" />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider border shadow-xs ${colorClass}`}
      >
        {icon}
        <span>{badge}</span>
      </span>
    );
  };

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all" || selectedBadge !== "all";

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── Compact Header & Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B0D0E]">
            Products
          </h1>
          <span className="bg-[#FFE1ED] text-[#F72585] text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-[#F72585]/20">
            {filteredProducts.length} Items
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-[#0B0D0E] shadow-xs"
                  : "text-stone-400 hover:text-stone-700"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-[#0B0D0E] shadow-xs"
                  : "text-stone-400 hover:text-stone-700"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Product Button */}
          <Link
            href="/admin/products/new"
            className="admin-primary-action px-3.5 py-2 text-xs sm:text-sm rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── Compact, Streamlined Filter Pills Row (Kam Space me & Responsive) ── */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-stone-200/90 shadow-xs space-y-2">
        {/* Row 1: Search Bar & Reset Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, fabric, category, slug..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-stone-200 bg-[#F7F7F6]/60 text-xs sm:text-sm text-[#0B0D0E] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/30 focus:border-[#F72585] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedBadge("all");
              }}
              className="text-xs font-bold text-[#F72585] hover:text-[#D91668] px-2.5 py-1.5 rounded-lg bg-[#FFE1ED] border border-[#F72585]/20 shrink-0 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Row 2: Badges Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-stone-100">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
            Badges:
          </span>
          {[
            { id: "all", label: "All Badges" },
            { id: "new-arrivals", label: "✨ New Arrivals" },
            { id: "bestseller", label: "🔥 Hot Bestseller" },
            { id: "trending", label: "📈 Trending" },
            { id: "exclusive", label: "🏷️ Exclusive" },
            { id: "none", label: "No Badge" },
          ].map((badge) => (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge.id)}
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBadge === badge.id
                  ? "bg-[#0B0D0E] text-white shadow-xs font-bold"
                  : "bg-[#F7F7F6] text-stone-600 hover:bg-stone-200/80 border border-stone-200/70"
              }`}
            >
              {badge.label}
            </button>
          ))}
        </div>

        {/* Row 3: Category Filter Pills (NICHE) */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-stone-100">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
              Category:
            </span>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-[#F72585] text-white shadow-xs font-bold"
                  : "bg-[#F7F7F6] text-stone-600 hover:bg-stone-200/80 border border-stone-200/70"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? "bg-[#F72585] text-white shadow-xs font-bold"
                    : "bg-[#F7F7F6] text-stone-600 hover:bg-stone-200/80 border border-stone-200/70"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Products Showcase: Modern Grid Layout ── */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-[5px] border border-stone-200/90 shadow-xs">
          <Package className="w-9 h-9 text-stone-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0B0D0E]">No products match filter</h3>
          <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
            Try resetting your search or badge filters to view your streetwear products.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Modern Compact Grid Cards (Kam Height me & Sleek) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {filteredProducts.map((product) => {
            const isExpanded = expandedProductId === product.id;
            const colors = parseColors(product.color_name);
            const displayImage =
              product.featured_image_url || product.product_images?.[0]?.image_url || "/image.png";
            const price = Number(product.price || 0);
            const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
            const discountPct =
              oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
            const variants = product.product_variants || [];
            const sizeList = Array.from(new Set(variants.map((v) => v.variant_name).filter(Boolean)));
            const categoryName = product.categories?.name || product.category_id || "Streetwear";

            return (
              <div
                key={product.id}
                className="bg-white rounded-[5px] border border-stone-200/90 hover:border-stone-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top: Compact Image Showcase (Height Kam) */}
                <div className="relative aspect-[9/9] w-full bg-[#F7F7F6] overflow-hidden border-b border-stone-100">
                  <Image
                    src={displayImage}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e: any) => {
                      e.currentTarget.src = "/image.png";
                    }}
                  />

                  {/* Top Left: Badge & Active Status */}
                  <div className="absolute top-1.5 left-1.5 z-10 flex flex-wrap gap-1 items-center">
                    {renderBadgePill(product.badge)}
                    <span
                      className={`inline-flex items-center gap-1 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded backdrop-blur-md shadow-xs ${
                        product.is_active
                          ? "bg-green-600/90 text-white"
                          : "bg-stone-800/80 text-white"
                      }`}
                    >
                      {product.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  {/* Top Right: Images Count & Storefront Quick View */}
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-2">
                    {product.product_images && product.product_images.length > 1 && (
                      <span className="bg-black/70 backdrop-blur-xs text-white text-[8.5px] font-extrabold px-1.5 py-0.5 rounded">
                        +{product.product_images.length}
                      </span>
                    )}
                    <Link
                      href={`/shop/${product.slug || product.id}`}
                      target="_blank"
                      className="w-5.5 h-5.5 rounded-full bg-white/90 hover:bg-white text-[#0B0D0E] shadow-xs flex items-center justify-center transition-all hover:scale-110"
                      title="View live product on store"
                    >
                      <ExternalLink className="w-4.5 h-4 bg-white p-[2px] rounded-full" />
                    </Link>
                  </div>

                  {/* Bottom Left Price Pill Overlay */}
                  <div className="absolute bottom-1.5 left-1.5 z-10 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-stone-200/80 shadow-xs flex items-center gap-1">
                    <span className="text-xs font-black text-[#0B0D0E]">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    {oldPrice && (
                      <span className="text-[9.5px] text-stone-400 line-through font-semibold">
                        ₹{oldPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                    {discountPct && (
                      <span className="text-[8.5px] font-black text-[#F72585] bg-[#FFE1ED] px-1 rounded">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Compact Info & Specs with Clean Spacing */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1">
                    {/* Category & 5 Stars with (Review Count) */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F72585]">
                        {categoryName}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                                i < Math.round(Number(product.rating || 5))
                                  ? "fill-[#F59E0B] text-[#F59E0B]"
                                  : "fill-stone-200 text-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] sm:text-[10.5px] font-bold text-stone-500 leading-none">
                          ({product.review_count ?? 0})
                        </span>
                      </div>
                    </div>

                    {/* Product Name */}

                     <Link
                      href={`/shop/${product.slug || product.id}`}
                      target="_blank"
                      title="View live product on store"
                    >
                      <h3 className="font-display font-[350] text-[#0B0D0E] text-[14.5px] sm:text-[15px] leading-snug line-clamp-1 group-hover:text-[#F72585] transition-colors pt-0.5">
                      {product.name}
                    </h3>
                    </Link>
                    

                    {/* Short Description */}
                    <p className="text-[11px] text-stone-500 line-clamp-1 leading-normal pt-0.5">
                      {formatSummary(product.short_description)}
                    </p>
                  </div>

                  {/* Colors */}
                  <div className="pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                      {colors.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-stone-400 uppercase text-[9px]">Colors:</span>
                          {colors.slice(0, 3).map((c) => (
                            <span
                              key={c.name}
                              title={c.name}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F7F7F6] border border-stone-200"
                            >
                              <span
                                className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-stone-700 text-[9.5px]">{c.name}</span>
                            </span>
                          ))}
                          {colors.length > 3 && (
                            <span className="text-stone-400 font-bold text-[9px]">+{colors.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Specifications Panel */}
                  {isExpanded && (
                    <div className="bg-[#FAF9F8] rounded-lg border border-stone-200 p-2.5 space-y-2 text-xs animate-fade-in my-1">
                      <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                        <span className="font-extrabold text-[9.5px] uppercase text-stone-500">
                          Product Specifications
                        </span>
                        <span className="text-[9.5px] text-stone-400 font-mono">
                          ID: {product.id}
                        </span>
                      </div>

                      {product.short_description && (
                        <div className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                          {formatSummary(product.short_description)}
                        </div>
                      )}

                      {product.description && (
                        <div className="pt-1 border-t border-stone-200">
                          <span className="text-[9.5px] font-bold text-stone-400 uppercase block mb-0.5">
                            Full Story:
                          </span>
                          <p className="text-[10.5px] text-stone-600 leading-relaxed max-h-20 overflow-y-auto whitespace-pre-line">
                            {product.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Bottom: Action Buttons */}
                  <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(product.id)}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                        isExpanded
                          ? "bg-[#FFE1ED] text-[#F72585] border border-[#F72585]/30"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                      }`}
                    >
                      <span>{isExpanded ? "Hide Specs" : "Specs & Info"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-1.5 rounded-md text-stone-600 hover:text-[#F72585] hover:bg-[#FFE1ED] border border-stone-200 transition-colors"
                        title="Edit product"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        disabled={isPending && isDeletingId === product.id}
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 transition-colors disabled:opacity-50"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Compact Responsive List View ── */
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const isExpanded = expandedProductId === product.id;
            const colors = parseColors(product.color_name);
            const displayImage =
              product.featured_image_url || product.product_images?.[0]?.image_url || "/image.png";
            const price = Number(product.price || 0);
            const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
            const discountPct =
              oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
            const variants = product.product_variants || [];
            const sizeList = Array.from(new Set(variants.map((v) => v.variant_name).filter(Boolean)));
            const categoryName = product.categories?.name || product.category_id || "Streetwear";

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-stone-200/90 hover:border-stone-400 shadow-xs overflow-hidden transition-all duration-200"
              >
                <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-14 h-16 sm:w-16 sm:h-20 shrink-0 rounded-lg bg-[#F7F7F6] border border-stone-200 overflow-hidden">
                      <Image
                        src={displayImage}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase text-[#F72585] bg-[#FFE1ED] px-1.5 py-0.5 rounded">
                          {categoryName}
                        </span>
                        {renderBadgePill(product.badge)}
                      </div>
                      <h3 className="font-display font-[350] text-[#0B0D0E] text-sm sm:text-base leading-snug line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-black text-[#0B0D0E]">
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        {oldPrice && (
                          <span className="text-[11px] text-stone-400 line-through">
                            ₹{oldPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                        {discountPct && (
                          <span className="text-[10px] font-bold text-[#F72585]">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => toggleExpand(product.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-all flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Hide" : "Details"}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <Link
                      href={`/shop/${product.slug || product.id}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-[#0B0D0E] hover:bg-stone-100 border border-stone-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-[#F72585] hover:bg-[#FFE1ED] border border-stone-200"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      disabled={isPending && isDeletingId === product.id}
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-[#FAF9F8] border-t border-stone-200 p-3.5 space-y-2 text-xs animate-fade-in">
                    <p className="text-stone-600 leading-relaxed">
                      <strong>Description:</strong> {product.description || formatSummary(product.short_description) || "N/A"}
                    </p>
                    <div className="flex flex-wrap gap-4 text-stone-600 pt-1">
                      <span><strong>Sizes:</strong> {sizeList.join(", ") || "S, M, L, XL, XXL"}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
