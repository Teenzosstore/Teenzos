import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShopHeroBanner from "./_components/ShopHeroBanner";
import ShopGrid from "./_components/ShopGrid";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { selectDisplayVariant } from "@/lib/productVariants";
import { SHOP_PRODUCTS } from "@/lib/shopProducts";

export const metadata = {
  title: "Shop Streetwear Collection | TEENZOS",
  description:
    "Explore the TEENZOS Streetwear Collection — oversized graphic tees, heavyweight hoodies, acid wash edits, and limited drops. Made for the streets.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; featured?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams.search || "";
  const featuredOnly = resolvedSearchParams.featured === "true";
  const categoryParam = resolvedSearchParams.category || "";

  let productsData: any[] = [];
  let categoriesData: any[] = [];

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    let productsQuery = supabase
      .from("products")
      .select(`
        id, name, slug, category_id, is_active, badge, rating, price, oldPrice, featured_image_url, color_group_id, color_name, created_at,
        product_images ( image_url ),
        product_variants ( id, variant_name, price, original_price, stock_quantity, is_active )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (searchQuery) {
      productsQuery = productsQuery.ilike("name", `%${searchQuery}%`);
    }

    if (featuredOnly) {
      productsQuery = productsQuery.eq("is_featured", true);
    }

    const { data: pData } = await productsQuery;
    if (pData) productsData = pData;

    const { data: cData } = await adminSupabase
      .from("categories")
      .select("*")
      .order("name");
    if (cData) categoriesData = cData;
  } catch (err) {
    console.error("ShopPage: Supabase query fallback to local catalogue", err);
  }

  // Parse DB products
  const parseProductColors = (colorNameField: string | null) => {
    if (!colorNameField) return [];
    try {
      if (colorNameField.startsWith("[")) {
        const parsed = JSON.parse(colorNameField) as { name: string; hex: string }[];
        return parsed.map((c) => ({ name: c.name.trim(), hex: c.hex || "#0B0D0E" })).filter((c) => c.name);
      }
    } catch (e) {}
    return colorNameField.split(",").map((c) => ({ name: c.trim(), hex: "#0B0D0E" })).filter((c) => c.name);
  };

  const dbProducts = (productsData || []).map((p: any) => {
    const variant = selectDisplayVariant(p.product_variants);

    return {
      id: p.id,
      variant_id: variant?.id || null,
      name: p.name,
      slug: p.slug,
      category_id: p.category_id,
      is_active: p.is_active,
      image_url: p.featured_image_url || p.product_images?.[0]?.image_url || "/image.png",
      price: variant?.price || p.price || 0,
      oldPrice: variant?.original_price || p.oldPrice || undefined,
      badge: p.badge,
      rating: p.rating || 5,
      colors: parseProductColors(p.color_name),
    };
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F7F7F6] pt-[104px] md:pt-[116px]">
        {/* ── Streetwear Graffiti Hero Banner ── */}
        <ShopHeroBanner />

        {/* ── Main Catalog & Filters Container ── */}
        <div className="max-w-[1450px] mx-auto px-2.5 sm:px-5 md:px-8 lg:px-10 pb-16 sm:pb-24">
          <ShopGrid
            initialProducts={dbProducts}
            categories={categoriesData}
            selectedCategory={categoryParam}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
