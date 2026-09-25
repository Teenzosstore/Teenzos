import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Categories from "@/components/Categories";
import TrendingNow from "@/components/TrendingNow";
import OversizedPromo from "@/components/OversizedPromo";
import WhyTeenzos from "@/components/WhyTeenzos";
import RealStories from "@/components/RealStories";
import NewsletterCTA from "@/components/NewsletterCTA";
import Footer from "@/components/Footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { selectDisplayVariant } from "@/lib/productVariants";

export const revalidate = 60;

const PRODUCT_SELECT = `
  id, name, slug, category_id, is_featured, is_active, badge, rating, color_name,
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
  eyebrow: "NEW SEASON '24",
  headline_top: "MADE FOR",
  headline_accent: "THE STREETS",
  subtitle: "Oversized silhouettes. Premium fabrics.\nDesigned to move with you.",
  button_text: "SHOP NOW",
  button_link: "/shop",
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
    { data: settingsData },
    { data: homeBannerImagesData },
    { data: lookbookImagesData, error: lookbookImagesError },
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
  ]);

  // Product counts per category
  const productCounts = (allProducts || []).reduce((acc: any, p: any) => {
    acc[p.category_id] = (acc[p.category_id] || 0) + 1;
    return acc;
  }, {});

  const adminCategories = categoriesData || [];
  const activeHomeCategories = adminCategories.filter(
    (category: any) => category.is_active || isOversizedTshirtCategory(category)
  );
  const categories = activeHomeCategories.map((c: any) => ({
    ...c,
    count: `${productCounts[c.id] || 0} styles`,
  }));
  const oversizedCategory = categories.find(isOversizedTshirtCategory);
  const homeCategories = oversizedCategory
    ? [
        ...categories
          .filter((category: any) => category.id !== oversizedCategory.id)
          .slice(0, HOME_CATEGORY_LIMIT - 1),
        oversizedCategory,
      ]
    : categories.slice(0, HOME_CATEGORY_LIMIT);

  const categoryName = (id: string) =>
    adminCategories.find((c: any) => c.id === id)?.name || id;

  const formatProducts = (rows: any[]) =>
    (rows || []).map((p: any) => {
      const variant = selectDisplayVariant(p.product_variants);
      const price = variant?.price || p.price || 0;
      const original = variant?.original_price || p.oldPrice || null;
      return {
        id: p.id,
        variant_id: variant?.id || null,
        category_id: p.category_id,
        slug: p.slug,
        name: p.name,
        price,
        sale_price: original && original > price ? original : null,
        image_url: p.featured_image_url || p.product_images?.[0]?.image_url || "/image.png",
        badge: p.badge || "New",
        rating: p.rating || 4.9,
        review_count: p.review_count || 24,
        is_featured: p.is_featured || false,
        category_name: categoryName(p.category_id),
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
  const heroText = heroLeftText(settingsData);
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
      <Categories categories={homeCategories} />
      <TrendingNow />
      <OversizedPromo />
      <WhyTeenzos />
      <RealStories />
      <NewsletterCTA />
      <Footer />
    </main>
  );
}
