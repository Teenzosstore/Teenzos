import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductViewSection from './_components/ProductViewSection'
import YouMayAlsoLikeSection from './_components/YouMayAlsoLikeSection'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductSizeChartPublic } from '@/actions/size-charts'
import { selectDisplayVariant } from '@/lib/productVariants'
import { slugify } from '@/lib/shopProducts'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const decodedId = decodeURIComponent(id).trim()

  let { data: product } = await supabase
    .from('products')
    .select('name, seo_title, seo_description, seo_keywords, featured_image_url')
    .eq('id', decodedId)
    .single()

  if (!product) {
    const { data: slugProduct } = await supabase
      .from('products')
      .select('name, seo_title, seo_description, seo_keywords, featured_image_url')
      .eq('slug', decodedId)
      .single()
    product = slugProduct
  }

  if (!product) {
    const adminSupabase = createAdminClient()
    const { data: slugIlikeProduct } = await adminSupabase
      .from('products')
      .select('name, seo_title, seo_description, seo_keywords, featured_image_url')
      .ilike('slug', decodedId)
      .single()
    product = slugIlikeProduct
  }

  if (!product) {
    return {}
  }

  const title = product.seo_title || `${product.name} | TEENZOS`
  const description = product.seo_description || `Shop ${product.name} online at TEENZOS.`
  const keywords = product.seo_keywords ? product.seo_keywords.split(',').map((k: string) => k.trim()) : []

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: product.featured_image_url ? [{ url: product.featured_image_url }] : [],
    },
  }
}

function renderProductPage(
  productData: any,
  categoryName: string,
  similarProducts: any[],
  reviews: any[],
  sizeChart: { imageUrl: string; title: string } | null,
  currentUser?: { id: string; name?: string } | null
) {
  // Compile image array
  let images: { image_url: string; color_name?: string | null }[] = []
  if (productData.product_images && productData.product_images.length > 0) {
    images = productData.product_images
  } else if (productData.gallery_images && productData.gallery_images.length > 0) {
    images = productData.gallery_images.map((img: string, i: number) => ({
      image_url: img,
      color_name: productData.colors?.[i]?.name || null,
    }))
  } else if (productData.featured_image_url) {
    images = [{ image_url: productData.featured_image_url }]
  }

  // Compile specifications (excluding Key Features)
  const information = (productData.product_information || [])
    .filter((item: any) => item.label !== 'Key Feature' && item.label !== 'Feature')
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))

  const variants = productData.product_variants || []

  const parseProductColors = (colorNameField: any) => {
    if (!colorNameField) {
      return [
        { name: 'Black', hex: '#0B0D0E' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Hot Pink', hex: '#FF007A' },
        { name: 'Cyan', hex: '#00C2FF' },
        { name: 'Heather Grey', hex: '#9E9E9E' },
      ]
    }
    if (Array.isArray(colorNameField)) return colorNameField
    try {
      if (typeof colorNameField === 'string' && colorNameField.startsWith('[')) {
        const parsed = JSON.parse(colorNameField) as { name: string; hex: string }[]
        return parsed.map((c) => ({ name: c.name.trim(), hex: c.hex || '#0B0D0E' })).filter((c) => c.name)
      }
    } catch (e) {}
    if (typeof colorNameField === 'string') {
      return colorNameField.split(',').map((c) => ({ name: c.trim(), hex: '#0B0D0E' })).filter((c) => c.name)
    }
    return [{ name: 'Black', hex: '#0B0D0E' }]
  }

  const colors = parseProductColors(productData.colors || productData.color_name)

  const realReviewCount = reviews.length > 0 ? reviews.length : (Number(productData.review_count) || 0)
  const realAverageRating = reviews.length > 0
    ? Number((reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1))
    : (realReviewCount > 0 ? (Number(productData.rating) || 0) : 0)

  // Parse dynamic features / checklist bullets from product_information table or raw data
  let bio = productData.short_description || null
  let parsedFeatures: string[] = []

  // Check product_information table first (clean dedicated relation)
  if (Array.isArray(productData.product_information)) {
    const fromInfo = productData.product_information
      .filter((item: any) => item.label === 'Key Feature' || item.label === 'Feature')
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((item: any) => item.value)
      .filter(Boolean)

    if (fromInfo.length > 0) {
      parsedFeatures = fromInfo
    }
  }

  // Fallback legacy parser for existing JSON strings
  if (parsedFeatures.length === 0) {
    if (productData.features && Array.isArray(productData.features) && productData.features.length > 0) {
      parsedFeatures = productData.features
    } else if (productData.short_description) {
      try {
        if (productData.short_description.startsWith('{')) {
          const parsed = JSON.parse(productData.short_description)
          bio = parsed.bio || null
          if (Array.isArray(parsed.features)) {
            parsedFeatures = parsed.features
          }
        } else if (productData.short_description.startsWith('[')) {
          const jsonFeatures = JSON.parse(productData.short_description)
          bio = null
          if (Array.isArray(jsonFeatures)) {
            parsedFeatures = jsonFeatures
          }
        }
      } catch {}
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAFAFB] relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
        {/* Bottom Left Vibrant Pink Splash SVG Accent */}
        <div className="absolute -bottom-10 -left-10 w-72 sm:w-96 h-72 sm:h-96 pointer-events-none z-0 opacity-70 select-none">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#FF007A]">
            <path
              d="M10 190 C0 140, 30 110, 20 60 C40 80, 60 70, 80 40 C85 75, 110 80, 130 60 C120 100, 150 120, 170 110 C145 150, 170 170, 140 200 C110 180, 80 205, 60 185 C40 200, 20 195, 10 190 Z"
              fill="currentColor"
              opacity="0.85"
            />
            <circle cx="160" cy="50" r="7" fill="currentColor" />
            <circle cx="175" cy="80" r="5" fill="currentColor" />
            <circle cx="20" cy="40" r="5" fill="currentColor" />
            <circle cx="8" cy="80" r="3.5" fill="currentColor" />
            <circle cx="50" cy="20" r="4" fill="currentColor" />
          </svg>
        </div>

        {/* Bottom Right Vibrant Cyan Splash SVG Accent */}
        <div className="absolute -bottom-10 -right-10 w-72 sm:w-96 h-72 sm:h-96 pointer-events-none z-0 opacity-70 select-none">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#00C2FF]">
            <path
              d="M190 190 C200 140, 170 110, 180 60 C160 80, 140 70, 120 40 C115 75, 90 80, 70 60 C80 100, 50 120, 30 110 C55 150, 30 170, 60 200 C90 180, 120 205, 140 185 C160 200, 180 195, 190 190 Z"
              fill="currentColor"
              opacity="0.85"
            />
            <circle cx="40" cy="50" r="7" fill="currentColor" />
            <circle cx="25" cy="80" r="5" fill="currentColor" />
            <circle cx="180" cy="40" r="5" fill="currentColor" />
            <circle cx="192" cy="80" r="3.5" fill="currentColor" />
            <circle cx="150" cy="20" r="4" fill="currentColor" />
          </svg>
        </div>

        <div className="max-w-wrap mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Main Product Showcase Section */}
          <ProductViewSection
            product={{
              id: productData.id,
              name: productData.name,
              badge: productData.badge || 'NEW ARRIVAL',
              rating: realReviewCount > 0 ? realAverageRating : 0,
              review_count: realReviewCount,
              sold_count: productData.sold_count || undefined,
              short_description: bio,
              description: productData.description,
              features: parsedFeatures,
              specifications: productData.specifications,
              colors: colors,
            }}
            images={images}
            variants={variants}
            information={information}
            categoryName={categoryName}
            categoryId={productData.category_id}
            sizeChart={sizeChart}
            reviews={reviews}
            currentUser={currentUser}
          />

          {/* You May Also Like Section (matching home page card design & category) */}
          <YouMayAlsoLikeSection
            products={similarProducts}
            currentProductId={productData.id}
            categoryId={productData.category_id}
            categoryName={categoryName}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch active size chart from admin (product-specific or global)
  const initialSizeChartResult = await getProductSizeChartPublic(id)
  let sizeChart = null
  if (initialSizeChartResult.success && initialSizeChartResult.data) {
    sizeChart = {
      imageUrl: initialSizeChartResult.data.image_url,
      title: initialSizeChartResult.data.name || 'Size Chart',
    }
  }

  const { data: { user: authUser } } = await supabase.auth.getUser()
  const currentUser = authUser
    ? {
        id: authUser.id,
        name:
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.name as string) ||
          authUser.email?.split('@')[0] ||
          'Customer',
      }
    : null


  // 2. Fetch from Supabase
  let productData: any = null
  const decodedId = decodeURIComponent(id).trim()
  const adminSupabase = createAdminClient()

  const PRODUCT_DETAIL_SELECT = `
    id, name, slug, category_id, is_active, badge, rating, review_count, short_description, description, featured_image_url, color_group_id, color_name, color_hex,
    use_global_size_chart, size_chart_image_url, size_chart_cloudinary_public_id,
    product_images ( image_url, color_name ),
    product_variants ( id, variant_name, price, original_price, stock_quantity, is_active ),
    product_information ( label, value, display_order )
  `

  // Try 1: by id using public client
  const { data: byIdData } = await supabase
    .from('products')
    .select(PRODUCT_DETAIL_SELECT)
    .eq('id', decodedId)
    .single()

  if (byIdData) {
    productData = byIdData
  } else {
    // Try 2: by slug using public client
    const { data: bySlugData } = await supabase
      .from('products')
      .select(PRODUCT_DETAIL_SELECT)
      .eq('slug', decodedId)
      .single()

    if (bySlugData) {
      productData = bySlugData
    } else {
      // Try 3: case-insensitive slug using admin client (bypasses RLS or casing issues)
      const { data: bySlugIlike } = await adminSupabase
        .from('products')
        .select(PRODUCT_DETAIL_SELECT)
        .ilike('slug', decodedId)
        .single()

      if (bySlugIlike) {
        productData = bySlugIlike
      } else {
        // Try 4: by id using admin client
        const { data: byIdAdmin } = await adminSupabase
          .from('products')
          .select(PRODUCT_DETAIL_SELECT)
          .eq('id', decodedId)
          .single()

        if (byIdAdmin) {
          productData = byIdAdmin
        }
      }
    }
  }

  // Try 5: If slug search failed, search products where slugified name matches decodedId
  if (!productData) {
    const { data: allActive } = await adminSupabase
      .from('products')
      .select(PRODUCT_DETAIL_SELECT)
      .eq('is_active', true)
    if (allActive && allActive.length > 0) {
      const match = allActive.find((p: any) => {
        const computed = p.slug || slugify(p.name)
        return computed.toLowerCase() === decodedId.toLowerCase()
      })
      if (match) {
        productData = match
        if (!match.slug && match.name) {
          const generatedSlug = slugify(match.name)
          adminSupabase.from('products').update({ slug: generatedSlug }).eq('id', match.id).then(() => {})
        }
      }
    }
  }

  if (!productData) {
    console.error('Product not found in Supabase:', id)
    notFound()
  }

  // If accessed by raw UUID, redirect to clean SEO-friendly product name slug!
  const targetSlug = productData.slug || slugify(productData.name)
  if (targetSlug && decodedId === productData.id && decodedId !== targetSlug) {
    redirect(`/shop/${targetSlug}`)
  }

  // 4. Resolve Category Name for DB product
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', productData.category_id)
    .single()

  const categoryName = category?.name || productData.category_id

  // 5. Fetch Size Chart if product has specific chart
  if (productData.id && productData.id !== id) {
    const dbSizeChartResult = await getProductSizeChartPublic(productData.id)
    if (dbSizeChartResult.success && dbSizeChartResult.data) {
      sizeChart = {
        imageUrl: dbSizeChartResult.data.image_url,
        title: dbSizeChartResult.data.name || 'Size Chart',
      }
    } else {
      sizeChart = null
    }
  }

  // Ensure size chart is null if explicitly disabled on this product
  if (
    productData &&
    productData.use_global_size_chart === false &&
    (!productData.size_chart_image_url || productData.size_chart_image_url === 'disabled')
  ) {
    sizeChart = null
  }

  // 6. Fetch Similar Products (Category-based)
  const { data: similarProductsData } = await supabase
    .from('products')
    .select(`
      id, name, slug, category_id, is_active, badge, rating, review_count, featured_image_url, color_name,
      product_images ( image_url ),
      product_variants ( id, price, original_price, stock_quantity, is_active )
    `)
    .eq('is_active', true)
    .eq('category_id', productData.category_id)
    .neq('id', productData.id)
    .limit(12)

  const similarProducts =
    similarProductsData && similarProductsData.length > 0
      ? similarProductsData.map((p: any) => {
          const variant = selectDisplayVariant(p.product_variants)
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            category_id: p.category_id,
            category_name: categoryName,
            image_url: p.featured_image_url || p.product_images?.[0]?.image_url || '/image.png',
            badge: p.badge,
            price: variant?.price || 1999,
            oldPrice: variant?.original_price || undefined,
            rating: Number(p.rating) || 0,
            review_count: Number(p.review_count) || 0,
            color_name: p.color_name,
            product_images: p.product_images,
            product_variants: p.product_variants,
            gallery_images: (p.product_images || []).map((img: any) => img.image_url),
          }
        })
      : []

  // 7. Fetch Reviews
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select(`
      id, rating, review_text, created_at,
      profiles:user_id ( full_name, email )
    `)
    .eq('product_id', productData.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  const reviews = (reviewsData || []).map((review: any) => ({
    ...review,
    comment: review.review_text,
  }))

  // 8. Fetch Real-time Sales / Sold Count from order_items
  const { data: orderItemRows } = await supabase
    .from('order_items')
    .select('quantity')
    .eq('product_id', productData.id)

  const totalQuantitySold = (orderItemRows || []).reduce(
    (acc: number, item: any) => acc + (Number(item.quantity) || 1),
    0
  )

  const dynamicReviewCount = reviews.length > 0 ? reviews.length : (Number(productData.review_count) || 0)
  const dynamicRating = reviews.length > 0
    ? Number((reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1))
    : (dynamicReviewCount > 0 ? (Number(productData.rating) || 0) : 0)

  const dynamicProductData = {
    ...productData,
    rating: dynamicRating,
    review_count: dynamicReviewCount,
    sold_count: totalQuantitySold > 0
      ? `${totalQuantitySold} sold`
      : (productData.sold_count || undefined),
  }

  return renderProductPage(dynamicProductData, categoryName, similarProducts, reviews, sizeChart, currentUser)
}
