import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Categories from "@/components/Categories";
import TrendingNow from "@/components/TrendingNow";
import OversizedPromo from "@/components/OversizedPromo";
import WhyTeenzos from "@/components/WhyTeenzos";
import RealStories from "@/components/RealStories";
import CustomerReviewsSection from "@/components/CustomerReviewsSection";
import NewsletterCTA from "@/components/NewsletterCTA";
import Footer from "@/components/Footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { selectDisplayVariant } from "@/lib/productVariants";
import { productMatchesCategory, slugify } from "@/lib/shopProducts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRODUCT_SELECT = `
  id, name, slug, category_id, is_featured, is_active, badge, rating, review_count, color_name, price, "oldPrice", featured_image_url,
  product_images ( image_url ),
  product_variants ( id, variant_name, price, original_price, stock_quantity, is_active )
`;

const HOME_CATEGORY_LIMIT = 7;

function isOversizedTshirtCategory(category: any) {
  const categoryText = `${category.id || ""} ${category.slug || ""} ${category.name || ""}`.toLowerCase();

  return categoryText.includes("oversize");
}

function isNewDropsCategory(category: any) {
  const categoryText = `${category.id || ""} ${category.slug || ""} ${category.name || ""}`.toLowerCase();

  return categoryText.includes("new") && categoryText.includes("drop");
}

function isBestSellersCategory(category: any) {
  const categoryText = `${category.id || ""} ${category.slug || ""} ${category.name || ""}`.toLowerCase();

  return categoryText.includes("best") && categoryText.includes("seller");
}

const DEFAULT_HERO_LEFT_TEXT = {
  eyebrow: "STREETWEAR",
  headline_top: "EXPRESS WHAT",
  headline_accent: "MOVES YOU",
  subtitle: "Bold designs. Premium comfort.\nMore than clothes, it’s a mindset.",
  button_text: "Shop Now",
  button_link: "/shop",
  secondary_button_text: "Explore Collections",
  secondary_button_link: "/shop",
};

const DEFAULT_OVERSIZED_SECTION = {
  background_image_url: "/OVERSIZED..webp",
  headline_top: "OVERSIZED.",
  headline_accent: "ALWAYS.",
  subtitle: "Relaxed fit. Maximum impact.",
  button_text: "SHOP OVERSIZED",
  button_link: "/shop?category=oversized-tees",
};

function heroLeftText(settings: any) {
  const source = settings?.announcements?.hero_left_text || {};

  return {
    eyebrow: source.eyebrow || DEFAULT_HERO_LEFT_TEXT.eyebrow,
    headline_top: source.headline_top || DEFAULT_HERO_LEFT_TEXT.headline_top,
    headline_accent: source.headline_accent || DEFAULT_HERO_LEFT_TEXT.headline_accent,
    subtitle: source.subtitle || DEFAULT_HERO_LEFT_TEXT.subtitle,
    button_text: source.button_text || DEFAULT_HERO_LEFT_TEXT.button_text,
    button_link: source.button_link || DEFAULT_HERO_LEFT_TEXT.button_link,
    secondary_button_text: source.secondary_button_text || DEFAULT_HERO_LEFT_TEXT.secondary_button_text,
    secondary_button_link: source.secondary_button_link || DEFAULT_HERO_LEFT_TEXT.secondary_button_link,
  };
}

function oversizedSectionSettings(settings: any) {
  const source = settings?.announcements?.oversized_section || {};

  return {
    background_image_url: source.background_image_url || DEFAULT_OVERSIZED_SECTION.background_image_url,
    headline_top: source.headline_top || DEFAULT_OVERSIZED_SECTION.headline_top,
    headline_accent: source.headline_accent || DEFAULT_OVERSIZED_SECTION.headline_accent,
    subtitle: source.subtitle || DEFAULT_OVERSIZED_SECTION.subtitle,
    button_text: source.button_text || DEFAULT_OVERSIZED_SECTION.button_text,
    button_link: source.button_link || DEFAULT_OVERSIZED_SECTION.button_link,
  };
}

export default async function Home() {
  const supabase = createAdminClient();

  const [
    { data: categoriesData },
    { data: allProducts },
    { data: heroSlidesData },
    { data: heroSectionData },
    { data: settingsData },
    { data: homeBannerImagesData },
    { data: lookbookImagesData, error: lookbookImagesError },
    { data: reviewsData },
  ] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("hero_section")
      .select("*")
      .eq("id", "main")
      .maybeSingle(),
    supabase
      .from("settings")
      .select("home_banner_enabled, announcements")
      .eq("id", "site_settings")
      .single(),
    supabase
      .from("home_banner_images")
      .select("id, image_url, link_url")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("lookbook_images")
      .select("id, image_url, link_url")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("reviews")
      .select(`
        id, rating, review_text, created_at, product_id, is_approved,
        products ( id, name, slug, featured_image_url, price, product_images ( image_url ) ),
        profiles:user_id ( full_name, email )
      `)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  // Product counts per category - computed live in real-time from active products in database
  const activeProducts = (allProducts || []).filter((p: any) => p.is_active !== false);

  const adminCategories = categoriesData || [];
  const activeHomeCategories = adminCategories.filter(
    (category: any) => category.is_active !== false
  );
  const categories = activeHomeCategories.map((c: any) => {
    const liveCount = activeProducts.filter((p: any) =>
      productMatchesCategory(p, c.id, c.slug)
    ).length;

    return {
      ...c,
      count: `${liveCount} ${liveCount === 1 ? "style" : "styles"}`,
    };
  });

  const categoryName = (id: string) =>
    adminCategories.find((c: any) => c.id === id)?.name || id;

  const formatProducts = (rows: any[]) =>
    (rows || []).map((p: any) => {
      const variant = selectDisplayVariant(p.product_variants);
      const price = Number(p.price || variant?.price || 0);
      const original = p.oldPrice ? Number(p.oldPrice) : (variant?.original_price ? Number(variant.original_price) : null);
      const discount = original && original > price ? `${Math.round(((original - price) / original) * 100)}% OFF` : "20% OFF";

      return {
        id: p.id,
        variant_id: variant?.id || null,
        category_id: p.category_id || "t-shirts",
        slug: p.slug || slugify(p.name) || p.id,
        name: p.name,
        price,
        oldPrice: original || (price ? Math.round(price * 1.25) : 1299),
        discount,
        sale_price: original && original > price ? original : null,
        image_url: p.featured_image_url || p.product_images?.[0]?.image_url || "/image.png",
        badge: p.badge || undefined,
        rating: Number(p.rating) || 0,
        review_count: Number(p.review_count) || 0,
        is_featured: p.is_featured || false,
        category_name: categoryName(p.category_id),
        color_name: p.color_name,
        product_images: p.product_images,
        product_variants: p.product_variants,
        gallery_images: (p.product_images || []).map((img: any) => img.image_url),
      };
    });

  const products = formatProducts(allProducts || []);

  // New drops: products assigned to the admin "New Drops" category
  const newDropsCategory = adminCategories.find(isNewDropsCategory);
  const newDropItems = newDropsCategory
    ? products.filter((p) => p.category_id === newDropsCategory.id).slice(0, 4)
    : [];

  const bestSellersCategory = adminCategories.find(isBestSellersCategory);
  const bestSellers = bestSellersCategory
    ? products.filter((p) => p.category_id === bestSellersCategory.id).slice(0, 6)
    : products.filter((p) => p.is_featured).slice(0, 6);

  const heroSlides = (heroSlidesData || [])
    .filter((s: any) => !s.position || s.position === "right")
    .map((s: any) => ({
      id: s.id,
      image_url: s.image_url,
      title: s.title,
      subtitle: s.subtitle,
      button_text: s.button_text,
      button_link: s.button_link,
    }));
  const homeBannerImages = homeBannerImagesData || [];
  const showHomeBanner = !!settingsData?.home_banner_enabled && homeBannerImages.length > 0;
  const heroText = heroSectionData
    ? {
        eyebrow: heroSectionData.eyebrow || DEFAULT_HERO_LEFT_TEXT.eyebrow,
        headline_top: heroSectionData.headline_top || DEFAULT_HERO_LEFT_TEXT.headline_top,
        headline_accent: heroSectionData.headline_accent || DEFAULT_HERO_LEFT_TEXT.headline_accent,
        subtitle: heroSectionData.subtitle || DEFAULT_HERO_LEFT_TEXT.subtitle,
        button_text: heroSectionData.button_text || DEFAULT_HERO_LEFT_TEXT.button_text,
        button_link: heroSectionData.button_link || DEFAULT_HERO_LEFT_TEXT.button_link,
        secondary_button_text: heroSectionData.secondary_button_text || DEFAULT_HERO_LEFT_TEXT.secondary_button_text,
        secondary_button_link: heroSectionData.secondary_button_link || DEFAULT_HERO_LEFT_TEXT.secondary_button_link,
      }
    : heroLeftText(settingsData);
  const oversizedSettings = oversizedSectionSettings(settingsData);
  const lookbookImages = lookbookImagesError ? undefined : lookbookImagesData || [];

  return (
    <main className="overflow-x-hidden">
      <Header />
      <Hero
        slides={heroSlides}
        backgroundImages={showHomeBanner ? homeBannerImages : []}
        leftText={heroText}
      />
      <TrustBar />
      <Categories categories={categories} />
      <TrendingNow initialProducts={products} />
      <OversizedPromo />
      <WhyTeenzos />
      <RealStories />
      <CustomerReviewsSection reviews={reviewsData || []} />
      <NewsletterCTA />
      <Footer />
    </main>
  );
}
