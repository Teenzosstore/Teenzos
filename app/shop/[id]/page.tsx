import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductViewSection from './_components/ProductViewSection'
import YouMayAlsoLikeSection from './_components/YouMayAlsoLikeSection'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSampleImages } from '@/lib/samples'
import { getProductSizeChartPublic } from '@/actions/size-charts'
import { selectDisplayVariant } from '@/lib/productVariants'
import { getProductByIdOrSlug, SHOP_PRODUCTS } from '@/lib/shopProducts'

const SAMPLE_CATEGORIES: Record<string, { name: string; description: string; price: number; originalPrice?: number }> = {
  'new-drops': {
    name: 'New Drop Tee',
    description: 'Fresh from the studio. Limited run, heavyweight cotton, bold graphics. Each piece tells a story.',
    price: 1299,
    originalPrice: 1599,
  },
  'best-sellers': {
    name: 'Bestseller Tee',
    description: "The one everyone's talking about. Proven fit, premium fabric, restocked by demand.",
    price: 1199,
    originalPrice: 1399,
  },
  'streetwear-collection': {
    name: 'Streetwear Essential',
    description: 'Core collection piece. Oversized fit, heavyweight fabric, built for the streets.',
    price: 1499,
    originalPrice: 1799,
  },
  'acid-wash': {
    name: 'Acid Wash Tee',
    description: 'One-of-one acid wash. No two pieces are identical. Distressed finish, premium cotton.',
    price: 1599,
    originalPrice: 1899,
  },
  'gym-collection': {
    name: 'Gym Performance Tee',
    description: 'Moisture-wicking, anti-odor, built for the grind. Technical fabric meets street style.',
    price: 999,
    originalPrice: 1299,
  },
  'limited-edition': {
    name: 'Limited Edition Drop',
    description: "Numbered release. Once it's gone, it's gone forever. Collector's grade quality.",
    price: 2499,
    originalPrice: 2999,
  },
}

function isSampleId(id: string): boolean {
  return id.startsWith('sample-')
}

function parseSampleId(id: string): { categoryId: string; index: number } | null {
  const match = id.match(/^sample-(.+)-\d+$/)
  if (!match) return null
  const parts = id.split('-')
  const index = parseInt(parts[parts.length - 1], 10)
  const categoryId = parts.slice(1, -1).join('-')
  return { categoryId, index }
}

function getSampleProductData(id: string) {
  const parsed = parseSampleId(id)
  if (!parsed) return null

  const { categoryId, index } = parsed
  const images = getSampleImages(categoryId)
  const categoryInfo = SAMPLE_CATEGORIES[categoryId]

  if (!categoryInfo || index >= images.length) return null

  return {
    id,
    name: `${categoryInfo.name} ${index + 1}`,
    slug: id,
    category_id: categoryId,
    is_active: true,
    badge: index === 0 ? 'NEW ARRIVAL' : undefined,
    rating: 4.8,
    review_count: 128,
    sold_count: '500+ sold',
    short_description: categoryInfo.description,
    description: `${categoryInfo.description} Heavyweight fabric, premium construction, and TeenZos signature street styling.`,
    fabric: '380 GSM Heavyweight Cotton',
    stitching: 'Double-needle stitching for durability',
    featured_image_url: images[index],
    color_group_id: null,
    color_name: 'Black',
    color_hex: '#0B0D0E',
    product_images: images.slice(0, 5).map((img, i) => ({
      image_url: img,
      color_name: i === 0 ? 'Black' : `Variant ${i + 1}`,
    })),
    product_variants: [
      { id: `${id}-s`, variant_name: 'S', price: categoryInfo.price, original_price: categoryInfo.originalPrice, stock_quantity: 10 },
      { id: `${id}-m`, variant_name: 'M', price: categoryInfo.price, original_price: categoryInfo.originalPrice, stock_quantity: 15 },
      { id: `${id}-l`, variant_name: 'L', price: categoryInfo.price, original_price: categoryInfo.originalPrice, stock_quantity: 20 },
      { id: `${id}-xl`, variant_name: 'XL', price: categoryInfo.price, original_price: categoryInfo.originalPrice, stock_quantity: 8 },
      { id: `${id}-xxl`, variant_name: 'XXL', price: categoryInfo.price, original_price: categoryInfo.originalPrice, stock_quantity: 5 },
    ],
    features: [
      'Premium cotton blend fabric',
      'Soft, breathable & comfortable',
      'Oversized streetwear fit',
      'Ribbed cuffs and hem',
      'High-quality graffiti print'
    ],
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  let { data: product } = await supabase
    .from('products')
    .select('name, seo_title, seo_description, seo_keywords, featured_image_url')
    .eq('id', id)
    .single()

  if (!product) {
    const { data: slugProduct } = await supabase
      .from('products')
      .select('name, seo_title, seo_description, seo_keywords, featured_image_url')
      .eq('slug', id)
      .single()
    product = slugProduct
  }

  if (!product) {
    const local = getProductByIdOrSlug(id)
    if (local) {
      return {
        title: `${local.name} | TEENZOS Streetwear`,
        description: local.description || `Shop ${local.name} online at TEENZOS.`,
        openGraph: {
          title: `${local.name} | TEENZOS`,
          description: local.description,
          images: [{ url: local.image_url }],
        },
      }
    }
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
  sizeChart: { imageUrl: string; title: string } | null
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

  // Compile information
  let information = productData.product_information || []
  if (productData.fabric) {
    information.push({ label: 'Fabric Details', value: productData.fabric, display_order: -2 })
  }
  if (productData.stitching) {
    information.push({ label: 'Stitching Details', value: productData.stitching, display_order: -1 })
  }
  information.sort((a: any, b: any) => a.display_order - b.display_order)

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
              rating: productData.rating || 4.8,
              review_count: productData.review_count || 128,
              sold_count: productData.sold_count || '500+ sold',
              short_description: productData.short_description,
              description: productData.description,
              features: productData.features,
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
          />

          {/* You May Also Like Section (6 products matching mockup) */}
          <YouMayAlsoLikeSection
            products={similarProducts}
            currentProductId={productData.id}
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

  // 1. Handle sample products
  if (isSampleId(id)) {
    const sampleProduct = getSampleProductData(id)
    if (!sampleProduct) notFound()
    return renderProductPage(sampleProduct, sampleProduct.category_id, [], [], null)
  }

  // 2. Fetch from Supabase
  let productData = null
  let productError = null

  const { data: dataWithSizeChart, error: errWithSizeChart } = await supabase
    .from('products')
    .select(`
      id, name, slug, category_id, is_active, badge, rating, short_description, description, fabric, stitching, featured_image_url, color_group_id, color_name, color_hex,
      use_global_size_chart, size_chart_image_url, size_chart_cloudinary_public_id,
      product_images ( image_url, color_name ),
      product_variants ( id, variant_name, price, original_price, stock_quantity, is_active ),
      product_information ( label, value, display_order ),
      product_faqs ( question, answer, display_order )
    `)
    .eq('id', id)
    .single()

  if (!errWithSizeChart && dataWithSizeChart) {
    productData = dataWithSizeChart
  } else {
    // Try by slug
    const { data: slugData } = await supabase
      .from('products')
      .select(`
        id, name, slug, category_id, is_active, badge, rating, short_description, description, fabric, stitching, featured_image_url, color_group_id, color_name, color_hex,
        use_global_size_chart, size_chart_image_url, size_chart_cloudinary_public_id,
        product_images ( image_url, color_name ),
        product_variants ( id, variant_name, price, original_price, stock_quantity, is_active ),
        product_information ( label, value, display_order ),
        product_faqs ( question, answer, display_order )
      `)
      .eq('slug', id)
      .single()

    if (slugData) {
      productData = slugData
    } else {
      productError = errWithSizeChart
    }
  }

  // 3. Fallback to Local Catalog Products (e.g. Bunny Graffiti Hoodie)
  if (!productData || !productData.is_active) {
    const localProduct = getProductByIdOrSlug(id)
    if (localProduct) {
      const formattedVariants = localProduct.sizes.map((s) => ({
        id: `${localProduct.id}-${s.toLowerCase()}`,
        variant_name: s,
        price: localProduct.price,
        original_price: localProduct.oldPrice,
        stock_quantity: 25,
        is_active: true,
      }))

      const galleryImages = localProduct.gallery_images || [
        localProduct.image_url,
        '/images/products/street-bunny-hoodie.jpg',
        '/images/products/urban-bunny-hoodie.jpg',
        '/images/products/signature-sweatshirt.jpg',
        localProduct.image_url,
      ]

      const productImages = galleryImages.map((img, i) => ({
        image_url: img,
        color_name: localProduct.colors?.[i]?.name || (i === 0 ? 'Black' : null),
      }))

      const formattedData = {
        id: localProduct.id,
        name: localProduct.name,
        slug: localProduct.slug,
        category_id: localProduct.category_id,
        is_active: true,
        badge: localProduct.badge || 'NEW ARRIVAL',
        rating: localProduct.rating || 4.8,
        review_count: localProduct.review_count || 128,
        sold_count: localProduct.sold_count || '500+ sold',
        short_description: localProduct.description,
        description: localProduct.description,
        fabric: localProduct.fabric || '380 GSM Heavyweight Cotton Fleece',
        stitching: localProduct.stitching || 'Double-needle reinforced stitching',
        featured_image_url: localProduct.image_url,
        colors: localProduct.colors,
        product_images: productImages,
        product_variants: formattedVariants,
        features: localProduct.features || [
          'Premium cotton blend fabric',
          'Soft, breathable & comfortable',
          'Oversized streetwear fit',
          'Ribbed cuffs and hem',
          'High-quality graffiti print'
        ],
        specifications: localProduct.specifications || [
          { label: 'Fabric Details', value: localProduct.fabric || '380 GSM Heavyweight Cotton Fleece' },
          { label: 'Fit Profile', value: 'Oversized Streetwear Silhouette' },
          { label: 'Hood & Neck', value: 'Double-Layered Hood with Drawstrings' },
          { label: 'Graphic Technique', value: 'High-Density Screen Graffiti Print' },
          { label: 'Stitching Details', value: localProduct.stitching || 'Double-needle reinforced stitching' },
          { label: 'Care Instructions', value: 'Machine wash cold inside out, tumble dry low' },
          { label: 'Country of Origin', value: 'Crafted with Pride in India' },
        ],
      }

      // Mockup-matching 6 similar products
      const similarProducts = SHOP_PRODUCTS.filter((p) => p.id !== localProduct.id)
        .slice(0, 6)
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          category_id: p.category_id,
          image_url: p.image_url,
          badge: p.badge,
          price: p.price,
          oldPrice: p.oldPrice,
          discount: p.discount,
          rating: p.rating,
          review_count: p.review_count,
        }))

      return renderProductPage(formattedData, localProduct.category_name, similarProducts, [], null)
    }

    console.error('Product not found or inactive:', id, productError)
    notFound()
  }

  // 4. Resolve Category Name for DB product
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', productData.category_id)
    .single()

  const categoryName = category?.name || productData.category_id

  // 5. Fetch Size Chart
  const sizeChartResult = await getProductSizeChartPublic(productData.id)
  let sizeChart = null
  if (sizeChartResult.success && sizeChartResult.data) {
    sizeChart = {
      imageUrl: sizeChartResult.data.image_url,
      title: sizeChartResult.data.name || 'Size Chart',
    }
  }

  // 6. Fetch Similar Products
  const { data: similarProductsData } = await supabase
    .from('products')
    .select(`
      id, name, slug, category_id, is_active, badge, rating, featured_image_url,
      product_images ( image_url ),
      product_variants ( id, price, original_price, stock_quantity, is_active )
    `)
    .eq('is_active', true)
    .eq('category_id', productData.category_id)
    .neq('id', productData.id)
    .limit(6)

  const similarProducts =
    similarProductsData && similarProductsData.length > 0
      ? similarProductsData.map((p: any) => {
          const variant = selectDisplayVariant(p.product_variants)
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            category_id: p.category_id,
            image_url: p.featured_image_url || p.product_images?.[0]?.image_url || '/image.png',
            badge: p.badge,
            price: variant?.price || 1999,
            oldPrice: variant?.original_price || undefined,
            rating: p.rating || 4.9,
            review_count: 80,
          }
        })
      : SHOP_PRODUCTS.filter((p) => p.id !== productData.id)
          .slice(0, 6)
          .map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category_id: p.category_id,
            image_url: p.image_url,
            badge: p.badge,
            price: p.price,
            oldPrice: p.oldPrice,
            discount: p.discount,
            rating: p.rating,
            review_count: p.review_count,
          }))

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

  return renderProductPage(productData, categoryName, similarProducts, reviews, sizeChart)
}
