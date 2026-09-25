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
  colors: { name: string; hex: string }[];
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
  { id: "sweatshirts", name: "Sweatshirts", icon: "sweatshirt" },
  { id: "jackets", name: "Jackets", icon: "jacket" },
  { id: "bottoms", name: "Bottoms", icon: "bottoms" },
  { id: "accessories", name: "Accessories", icon: "accessories" },
];

export function productMatchesCategory(p: ShopProduct, categoryId: string): boolean {
  if (!categoryId || categoryId === "all") return true;

  const id = categoryId.toLowerCase();

  // 1. Men Streetwear
  if (id === "men") {
    return !p.gender || p.gender.includes("men") || p.gender.includes("unisex");
  }

  // 2. Women Streetwear
  if (id === "women") {
    return !p.gender || p.gender.includes("women") || p.gender.includes("unisex");
  }

  // 3. New Arrivals Drop (Curated category)
  if (id === "new-arrivals" || id === "new" || id === "new-drops") {
    return (
      p.curated_category === "new-arrivals" ||
      p.badge?.toUpperCase() === "NEW" ||
      p.tags?.includes("new-arrivals") ||
      false
    );
  }

  // 4. Hot Bestseller (HOT - Most popular streetwear fits)
  if (id === "bestseller" || id === "best-sellers" || id === "hot-bestseller") {
    return (
      p.curated_category === "bestseller" ||
      p.badge?.toUpperCase() === "HOT" ||
      p.badge?.toLowerCase() === "bestseller" ||
      p.tags?.includes("bestseller") ||
      false
    );
  }

  // 5. Trending (TRENDING - Viral fits setting the wave)
  if (id === "trending") {
    return (
      p.curated_category === "trending" ||
      p.badge?.toUpperCase() === "TRENDING" ||
      p.tags?.includes("trending") ||
      false
    );
  }

  // 6. Exclusive (EXCLUSIVE - Limited edition 1-of-1 drops)
  if (id === "exclusive" || id === "limited-edition") {
    return (
      p.curated_category === "exclusive" ||
      p.badge?.toUpperCase() === "EXCLUSIVE" ||
      p.tags?.includes("exclusive") ||
      false
    );
  }

  // 7. Clothing / Apparel categories
  if (id === "hoodies" || id.includes("hoodie")) return p.category_id === "hoodies";
  if (id === "t-shirts" || id === "tshirts" || id.includes("oversize") || id === "acid-wash") {
    return p.category_id === "t-shirts";
  }
  if (id === "sweatshirts" || id.includes("sweat")) return p.category_id === "sweatshirts";
  if (id === "jackets" || id.includes("jacket")) return p.category_id === "jackets";
  if (id === "bottoms" || id.includes("bottom") || id.includes("cargo") || id.includes("jogger")) {
    return p.category_id === "bottoms";
  }
  if (id === "accessories" || id.includes("cap")) return p.category_id === "accessories";

  return p.category_id === categoryId;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  // ── Curated: New Arrivals (4 products) ──
  // 1. Bunny Graffiti Hoodie
  {
    id: "bunny-graffiti-hoodie",
    slug: "bunny-graffiti-hoodie",
    name: "Bunny Graffiti Hoodie",
    category_id: "hoodies",
    category_name: "Hoodies",
    curated_category: "new-arrivals",
    price: 1999,
    oldPrice: 2499,
    discount: "20% OFF",
    image_url: "/images/products/bunny-graffiti-hoodie.jpg",
    badge: "NEW ARRIVAL",
    rating: 4.8,
    review_count: 128,
    sold_count: "500+ sold",
    sizes: ["S", "M", "L", "XL", "XXL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "White", hex: "#FFFFFF" },
      { name: "Hot Pink", hex: "#F72585" },
      { name: "Cyan", hex: "#36B8C5" },
      { name: "Heather Grey", hex: "#9E9E9E" },
    ],
    gallery_images: [
      "/images/products/bunny-graffiti-hoodie.jpg",
      "/images/products/street-bunny-hoodie.jpg",
      "/images/products/urban-bunny-hoodie.jpg",
      "/images/products/signature-sweatshirt.jpg",
      "/images/products/bunny-graffiti-hoodie.jpg",
    ],
    description: "Bold streetwear hoodie with iconic TeenZos bunny graffiti design. Premium fabric, oversized fit and all-day comfort. More than clothes, it's a lifestyle.",
    fabric: "380 GSM Heavyweight Cotton Fleece",
    stitching: "Double-needle reinforced stitching",
    features: [
      "Premium cotton blend fabric",
      "Soft, breathable & comfortable",
      "Oversized streetwear fit",
      "Ribbed cuffs and hem",
      "High-quality graffiti print",
      "Unisex design",
    ],
    specifications: [
      { label: "Fabric", value: "380 GSM Heavyweight Cotton Fleece" },
      { label: "Fit", value: "Oversized Streetwear Silhouette" },
      { label: "Neckline", value: "Double-Layered Hood with Drawstrings" },
      { label: "Print Technique", value: "High-Density Screen Graffiti Print" },
      { label: "Care Instructions", value: "Machine wash cold inside out, tumble dry low" },
      { label: "Origin", value: "Crafted in India" },
    ],
  },

  // 2. Street Bunny Hoodie
  {
    id: "street-bunny-hoodie",
    slug: "street-bunny-hoodie",
    name: "Street Bunny Hoodie",
    category_id: "hoodies",
    category_name: "Hoodies",
    curated_category: "new-arrivals",
    price: 1999,
    oldPrice: 2499,
    discount: "20% OFF",
    image_url: "/images/products/street-bunny-hoodie.jpg",
    badge: "NEW",
    rating: 4.9,
    review_count: 96,
    sizes: ["S", "M", "L", "XL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Orange", hex: "#FF6B35" },
      { name: "Black", hex: "#0B0D0E" },
    ],
    description: "Clean snow-white oversized hoodie with multi-color street graffiti bunny artwork. Ultra-soft interior, ribbed cuffs, and iconic kangaroo pocket.",
    fabric: "380 GSM French Terry Fleece",
    stitching: "Precision bar-tacked seams",
  },

  // 3. Urban Bunny Hoodie
  {
    id: "urban-bunny-hoodie",
    slug: "urban-bunny-hoodie",
    name: "Urban Bunny Hoodie",
    category_id: "hoodies",
    category_name: "Hoodies",
    curated_category: "new-arrivals",
    price: 1999,
    oldPrice: 2499,
    discount: "20% OFF",
    image_url: "/images/products/urban-bunny-hoodie.jpg",
    badge: "NEW",
    rating: 4.9,
    review_count: 104,
    sizes: ["S", "M", "L", "XL", "XXL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Hot Pink", hex: "#F72585" },
      { name: "Cyan", hex: "#36B8C5" },
      { name: "Black", hex: "#0B0D0E" },
    ],
    description: "Bold electric magenta hoodie stamped with the signature high-contrast Teenzos street bunny. Designed to turn heads day or night.",
    fabric: "380 GSM Cotton Blend",
    stitching: "Heavyweight ribbed collar & hem",
  },

  // 3b. Paint Drip Hoodie
  {
    id: "paint-drip-hoodie",
    slug: "paint-drip-hoodie",
    name: "Paint Drip Hoodie",
    category_id: "hoodies",
    category_name: "Hoodies",
    curated_category: "new-arrivals",
    price: 1999,
    oldPrice: 2499,
    discount: "20% OFF",
    image_url: "/images/products/paint-drip-hoodie.jpg",
    badge: "NEW",
    rating: 4.9,
    review_count: 88,
    sizes: ["S", "M", "L", "XL", "XXL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Cyan", hex: "#36B8C5" },
    ],
    gallery_images: [
      "/images/products/paint-drip-hoodie.jpg",
      "/images/products/street-bunny-hoodie.jpg",
      "/images/products/bunny-graffiti-hoodie.jpg",
    ],
    description: "Crisp white streetwear hoodie stamped with vivid cyan graffiti paint splatters and street drips. 380 GSM fleece with relaxed drop shoulders.",
    fabric: "380 GSM Heavyweight Cotton Fleece",
    stitching: "Double-needle reinforced stitching",
  },

  // 4. Bunny Cap
  {
    id: "bunny-cap",
    slug: "bunny-cap",
    name: "Bunny Cap",
    category_id: "accessories",
    category_name: "Accessories",
    curated_category: "new-arrivals",
    price: 599,
    oldPrice: 799,
    discount: "25% OFF",
    image_url: "/images/products/bunny-cap.jpg",
    badge: "NEW",
    rating: 4.9,
    review_count: 150,
    sizes: ["Free Size"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "White", hex: "#FFFFFF" },
    ],
    description: "Structured 6-panel baseball cap featuring high-density 3D neon embroidery of the Teenzos rabbit bunny with sunglasses. Adjustable brass buckle strap.",
    fabric: "100% Heavy Brushed Cotton",
    stitching: "Embroidered eyelets and sweatband",
  },

  // ── Curated: Hot Bestseller (4 products) ──
  // 5. Neon Bunny Oversized Tee (Home Page #1)
  {
    id: "prod-1",
    slug: "neon-bunny-oversized-tee",
    name: "Neon Bunny Oversized Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "bestseller",
    price: 699,
    oldPrice: 999,
    discount: "30% OFF",
    image_url: "/images/trending_now/trending_now1.jpeg",
    badge: "HOT",
    rating: 5.0,
    review_count: 320,
    sizes: ["S", "M", "L", "XL", "XXL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Cyan", hex: "#36B8C5" },
      { name: "Pink", hex: "#F72585" },
      { name: "Light Grey", hex: "#E8E8E6" },
    ],
    description: "Our #1 most viral tee. Showcases the iconic Teenzos Neon Bunny in bright cyan and pink spray tones over jet-black heavyweight cotton.",
    fabric: "240 GSM Bio-Washed Combed Cotton",
    stitching: "Twin-needle hem and sleeves",
  },

  // 6. Oversized Street Tee
  {
    id: "oversized-street-tee",
    slug: "oversized-street-tee",
    name: "Oversized Street Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "bestseller",
    price: 799,
    oldPrice: 999,
    discount: "20% OFF",
    image_url: "/images/explore/img01.png",
    badge: "HOT",
    rating: 4.9,
    review_count: 184,
    sizes: ["S", "M", "L", "XL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Cyan", hex: "#36B8C5" },
      { name: "Black", hex: "#0B0D0E" },
    ],
    description: "Boxy fit, wide sleeves, and dropped shoulders. Clean streetwear silhouette created for effortless everyday styling.",
    fabric: "240 GSM Bio-Washed Cotton",
    stitching: "Chain-stitched shoulders",
  },

  // 7. Chase Your Dreams Tee
  {
    id: "prod-2",
    slug: "chase-your-dreams-tee",
    name: "Chase Your Dreams Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "bestseller",
    price: 799,
    oldPrice: 1099,
    discount: "27% OFF",
    image_url: "/images/trending_now/trending_now2.jpeg",
    badge: "HOT",
    rating: 4.8,
    review_count: 165,
    sizes: ["S", "M", "L", "XL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Cream", hex: "#F5EBE6" },
    ],
    description: "Inspirational urban quote typography tee with minimal back print and relaxed dropped-shoulder cut.",
    fabric: "240 GSM Cotton Jersey",
    stitching: "Ribbed crew neckline",
  },

  // 8. Graffiti Print Tee
  {
    id: "graffiti-print-tee",
    slug: "graffiti-print-tee",
    name: "Graffiti Print Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "bestseller",
    price: 799,
    oldPrice: 999,
    discount: "20% OFF",
    image_url: "/images/trending_now/trending_now3.jpeg",
    badge: "HOT",
    rating: 4.8,
    review_count: 210,
    sizes: ["S", "M", "L", "XL", "XXL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Pink", hex: "#F72585" },
      { name: "White", hex: "#FFFFFF" },
    ],
    description: "240 GSM combed cotton oversized streetwear t-shirt. High-density screen print with fade-resistant pigments and pre-shrunk wash.",
    fabric: "240 GSM 100% Combed Cotton",
    stitching: "Reinforced collar with Lycra rib",
  },

  // ── Curated: Trending (4 products) ──
  // 9. Reality Check Tee
  {
    id: "prod-3",
    slug: "reality-check-tee",
    name: "Reality Check Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "trending",
    price: 699,
    oldPrice: 999,
    discount: "30% OFF",
    image_url: "/images/trending_now/trending_now3.jpeg",
    badge: "TRENDING",
    rating: 4.9,
    review_count: 198,
    sizes: ["S", "M", "L", "XL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Charcoal", hex: "#1A1E20" },
    ],
    description: "Anime-infused cyberpunk street art graphic printed on deep black heavyweight cotton. Crisp detailing that survives dozens of washes.",
    fabric: "240 GSM 100% Cotton",
    stitching: "Double-needle stitching throughout",
  },

  // 10. Teenzos Classic Tee
  {
    id: "prod-4",
    slug: "teenzos-classic-tee",
    name: "Teenzos Classic Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "trending",
    price: 599,
    oldPrice: 899,
    discount: "33% OFF",
    image_url: "/images/trending_now/trending_now4.jpeg",
    badge: "TRENDING",
    rating: 4.9,
    review_count: 240,
    sizes: ["S", "M", "L", "XL", "XXL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Cyan", hex: "#36B8C5" },
      { name: "Black", hex: "#0B0D0E" },
    ],
    description: "The wardrobe foundation. Clean minimalistic Teenzos chest logo with perfect drop shoulder drape.",
    fabric: "220 GSM Cotton Jersey",
    stitching: "Tape-reinforced back neck",
  },

  // 11. Good Days Ahead Tee
  {
    id: "prod-5",
    slug: "good-days-ahead-tee",
    name: "Good Days Ahead Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "trending",
    price: 699,
    oldPrice: 999,
    discount: "30% OFF",
    image_url: "/images/trending_now/trending_now5.jpeg",
    badge: "TRENDING",
    rating: 4.8,
    review_count: 142,
    sizes: ["S", "M", "L", "XL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Midnight", hex: "#1F2428" },
      { name: "Black", hex: "#0B0D0E" },
      { name: "White", hex: "#FFFFFF" },
    ],
    description: "Vibrant multi-color optimistic streetwear graphic print on premium midnight fabric. Soft hand feel and ultra-breathable.",
    fabric: "240 GSM Pre-Shrunk Cotton",
    stitching: "Reinforced collar",
  },

  // 12. Signature Hoodie / Sweatshirt
  {
    id: "signature-hoodie",
    slug: "signature-hoodie",
    name: "Signature Hoodie",
    category_id: "hoodies",
    category_name: "Hoodies",
    curated_category: "trending",
    price: 1799,
    oldPrice: 2299,
    discount: "22% OFF",
    image_url: "/images/products/signature-sweatshirt.jpg",
    badge: "TRENDING",
    rating: 4.9,
    review_count: 120,
    sizes: ["S", "M", "L", "XL", "XXL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Grey", hex: "#9E9E9E" },
      { name: "White", hex: "#FFFFFF" },
    ],
    description: "Classic black crewneck sweatshirt featuring the hand-styled spray graffiti 'TEENZOS' crown insignia. Ultra-cozy fleece lining.",
    fabric: "340 GSM Heavyweight Loopback Cotton",
    stitching: "Overlock seam finish",
  },

  // ── Curated: Exclusive (4 products) ──
  // 13. Tokyo Drift Streetwear Windbreaker / Jacket
  {
    id: "tokyo-drift-windbreaker",
    slug: "tokyo-drift-windbreaker",
    name: "Tokyo Drift Windbreaker",
    category_id: "jackets",
    category_name: "Jackets",
    curated_category: "exclusive",
    price: 2499,
    oldPrice: 3199,
    discount: "22% OFF",
    image_url: "/images/hero/producthero1.png",
    badge: "EXCLUSIVE",
    rating: 4.9,
    review_count: 64,
    sizes: ["S", "M", "L", "XL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Cyan", hex: "#36B8C5" },
    ],
    description: "Water-resistant matte nylon windbreaker jacket with electric cyan streetwear detailing, waterproof front zips, and elastic storm cuffs.",
    fabric: "100% Matte Ripstop Nylon",
    stitching: "Sealed seams with YKK zip closures",
  },

  // 14. Cargo Joggers
  {
    id: "cargo-joggers",
    slug: "cargo-joggers",
    name: "Cargo Joggers",
    category_id: "bottoms",
    category_name: "Bottoms",
    curated_category: "exclusive",
    price: 1299,
    oldPrice: 1799,
    discount: "28% OFF",
    image_url: "/images/products/cargo-joggers.jpg",
    badge: "EXCLUSIVE",
    rating: 4.8,
    review_count: 72,
    sizes: ["S", "M", "L", "XL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Black", hex: "#0B0D0E" },
      { name: "Green", hex: "#2E5A44" },
    ],
    description: "Relaxed-tapered cargo pants with pink graffiti typography detailing. Deep utility pockets, elasticated drawstring waistband, and cuffed ankles.",
    fabric: "Heavyweight Cotton Twill with Stretch",
    stitching: "Double-reinforced pocket gussets",
  },

  // 15. Acid Wash Heavy Tee
  {
    id: "acid-wash-heavy-tee",
    slug: "acid-wash-heavy-tee",
    name: "Acid Wash Heavy Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "exclusive",
    price: 899,
    oldPrice: 1199,
    discount: "25% OFF",
    image_url: "/images/hero/producthero2.png",
    badge: "EXCLUSIVE",
    rating: 4.8,
    review_count: 112,
    sizes: ["S", "M", "L", "XL", "XXL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Charcoal", hex: "#1A1E20" },
      { name: "Black", hex: "#0B0D0E" },
    ],
    description: "Vintage enzyme acid-washed tee where each piece features a one-of-a-kind stone wash pattern. Built from heavyweight cotton.",
    fabric: "260 GSM Acid-Washed Cotton",
    stitching: "Distressed edge detailing",
  },

  // 16. Cyber Streetwear Heavy Tee
  {
    id: "cyber-streetwear-heavy-tee",
    slug: "cyber-streetwear-heavy-tee",
    name: "Cyber Streetwear Heavy Tee",
    category_id: "t-shirts",
    category_name: "T-Shirts",
    curated_category: "exclusive",
    price: 999,
    oldPrice: 1399,
    discount: "28% OFF",
    image_url: "/images/hero/producthero3.png",
    badge: "EXCLUSIVE",
    rating: 4.9,
    review_count: 85,
    sizes: ["S", "M", "L", "XL"],
    in_stock: true,
    is_active: true,
    gender: ["men", "women", "unisex"],
    colors: [
      { name: "Charcoal", hex: "#1A1E20" },
      { name: "Cyan", hex: "#36B8C5" },
    ],
    description: "Heavyweight drop-shoulder street t-shirt featuring high-density typography and neon cyan detailing.",
    fabric: "250 GSM Combed Cotton",
    stitching: "Reinforced shoulder-to-shoulder tape",
  },
];

export function getProductByIdOrSlug(idOrSlug: string): ShopProduct | undefined {
  if (idOrSlug === "signature-sweatshirt" || idOrSlug === "signature-hoodie") {
    return SHOP_PRODUCTS.find((p) => p.id === "signature-hoodie" || p.id === "signature-sweatshirt");
  }
  return SHOP_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}
