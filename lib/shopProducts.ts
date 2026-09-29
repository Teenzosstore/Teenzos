export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  category_name: string;
  price: number;
  oldPrice: number;
  discount: string;
  image_url: string;
  badge?: string;
  rating: number;
  review_count: number;
  sizes: string[];
  in_stock: boolean;
  is_active: boolean;
  colors: { name: string; hex: string; image_url?: string }[];
  color_name?: string | null;
  product_images?: any[];
  product_variants?: any[];
  images?: any[];
  description?: string;
  fabric?: string;
  stitching?: string;
  gender?: ("men" | "women" | "unisex")[];
  tags?: string[];
  curated_category?: "new-arrivals" | "bestseller" | "trending" | "exclusive";
  gallery_images?: string[];
  sold_count?: string;
  features?: string[];
  specifications?: { label: string; value: string }[];
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface ShopCategory {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  description?: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  { id: "all", name: "All Products", icon: "grid" },
  { id: "men", name: "Men", icon: "men", badge: "POPULAR", description: "Oversized & boxy streetwear fits" },
  { id: "women", name: "Women", icon: "women", badge: "HOT", description: "Relaxed streetwear & crop graphics" },
  { id: "new-arrivals", name: "New Arrivals", icon: "sparkles", badge: "NEW", description: "Fresh drops dropped weekly" },
  { id: "bestseller", name: "Hot Bestseller", icon: "flame", badge: "HOT", description: "Most popular streetwear fits" },
  { id: "trending", name: "Trending", icon: "trending", badge: "TRENDING", description: "Viral fits setting the wave" },
  { id: "exclusive", name: "Exclusive", icon: "tag", badge: "EXCLUSIVE", description: "Limited edition 1-of-1 drops" },
  { id: "hoodies", name: "Hoodies", icon: "hoodie" },
  { id: "t-shirts", name: "T-Shirts", icon: "tshirt" },
  { id: "jackets", name: "Jackets", icon: "jacket" },
  { id: "bottoms", name: "Bottoms", icon: "bottoms" },
  { id: "accessories", name: "Accessories", icon: "accessories" },
];

export function productMatchesCategory(
  p: any,
  categoryId: string,
  categorySlug?: string
): boolean {
  if (!p) return false;
  if (!categoryId || categoryId === "all") return true;

  const id = String(categoryId).toLowerCase().trim();
  const slug = String(categorySlug || "").toLowerCase().trim();
  const pCat = String(p.category_id || "").toLowerCase().trim();

  // 1. Direct match on ID or slug first
  if (pCat && (pCat === id || (slug && pCat === slug) || p.category_id === categoryId)) {
    return true;
  }

  // 2. Curated badge / collection categories
  // New Arrivals Drop (Curated category or badge)
  if (id === "new-arrivals" || id === "new" || id === "new-drops" || slug === "new-arrivals") {
    const badgeNorm = (p.badge || "").trim().toLowerCase();
    return (
      badgeNorm.includes("new") ||
      p.curated_category === "new-arrivals" ||
      (Array.isArray(p.tags) && p.tags.includes("new-arrivals")) ||
      pCat === "new-drops" ||
      pCat === "new-arrivals" ||
      false
    );
  }

  // Hot Bestseller (HOT - Most popular streetwear fits)
  if (id === "bestseller" || id === "best-sellers" || id === "hot-bestseller" || slug === "bestseller") {
    const badgeNorm = (p.badge || "").trim().toLowerCase();
    return (
      badgeNorm.includes("hot") ||
      badgeNorm.includes("best") ||
      p.curated_category === "bestseller" ||
      (Array.isArray(p.tags) && p.tags.includes("bestseller")) ||
      pCat === "best-sellers" ||
      pCat === "bestseller" ||
      false
    );
  }

  // Trending (TRENDING - Viral fits setting the wave)
  if (id === "trending" || slug === "trending") {
    const badgeNorm = (p.badge || "").trim().toLowerCase();
    return (
      badgeNorm.includes("trend") ||
      badgeNorm.includes("fire") ||
      p.curated_category === "trending" ||
      (Array.isArray(p.tags) && p.tags.includes("trending")) ||
      pCat === "trending" ||
      false
    );
  }

  // Exclusive (EXCLUSIVE - Numbered runs, 1-of-1 drops)
  if (id === "exclusive" || id === "limited-edition" || slug === "exclusive") {
    const badgeNorm = (p.badge || "").trim().toLowerCase();
    return (
      badgeNorm.includes("exclus") ||
      badgeNorm.includes("limit") ||
      p.curated_category === "exclusive" ||
      (Array.isArray(p.tags) && p.tags.includes("exclusive")) ||
      pCat === "exclusive" ||
      pCat === "limited-edition" ||
      false
    );
  }

  // 3. Men Streetwear
  if (id === "men" || slug === "men") {
    const gender = String(p.gender || "").toLowerCase();
    return pCat === "men" || (gender.length > 0 && (gender.includes("men") || gender.includes("unisex")));
  }

  // 4. Women Streetwear
  if (id === "women" || slug === "women") {
    const gender = String(p.gender || "").toLowerCase();
    return pCat === "women" || (gender.length > 0 && (gender.includes("women") || gender.includes("unisex")));
  }

  // 5. Apparel categories (flexible fallback matching)
  if (id === "hoodies" || slug === "hoodies" || id.includes("hoodie")) {
    return pCat === "hoodies" || pCat.includes("hoodie");
  }
  if (id === "t-shirts" || slug === "t-shirts" || id === "tshirts" || id.includes("oversize") || id === "acid-wash") {
    return pCat === "t-shirts" || pCat === "tshirts" || pCat.includes("oversize") || pCat.includes("t-shirt");
  }
  if (id === "jackets" || slug === "jackets" || id.includes("jacket")) {
    return pCat === "jackets" || pCat.includes("jacket");
  }
  if (id === "sweatshirts" || slug === "sweatshirts" || id.includes("sweatshirt")) {
    return pCat === "sweatshirts" || pCat.includes("sweatshirt");
  }
  if (id === "bottoms" || slug === "bottoms" || id.includes("bottom") || id.includes("cargo") || id.includes("jogger")) {
    return pCat === "bottoms" || pCat.includes("bottom") || pCat.includes("cargo") || pCat.includes("jogger");
  }
  if (id === "accessories" || slug === "accessories" || id.includes("accessori") || id.includes("cap")) {
    return pCat === "accessories" || pCat.includes("accessori") || pCat.includes("cap");
  }

  return p.category_id === categoryId || pCat === id || (slug !== "" && pCat === slug);
}

// Products are loaded dynamically from Supabase database
export const SHOP_PRODUCTS: ShopProduct[] = [];

export function getProductByIdOrSlug(idOrSlug: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}
