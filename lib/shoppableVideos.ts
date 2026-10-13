import { selectDisplayVariant } from '@/lib/productVariants'

// Each slot is the homepage section the video section is rendered right after,
// in homepage order. 'before_products' / 'after_products' keep their original
// stored values so existing saved settings stay valid.
export const VIDEO_SECTION_PLACEMENTS = [
  { value: 'after_hero', after: 'Hero Banner' },
  { value: 'after_trust_bar', after: 'Trust Bar' },
  { value: 'before_products', after: 'Shop by Category' },
  { value: 'after_products', after: 'Trending Products' },
  { value: 'after_oversized', after: 'Oversized Promo' },
  { value: 'after_why', after: 'Why TeenZos' },
  { value: 'after_stories', after: 'Real Stories' },
  { value: 'after_reviews', after: 'Customer Reviews' },
  { value: 'after_newsletter', after: 'Newsletter' },
] as const

export type VideoSectionPlacement = (typeof VIDEO_SECTION_PLACEMENTS)[number]['value']

export const DEFAULT_VIDEO_PLACEMENT: VideoSectionPlacement = 'after_products'

export function normalizeVideoPlacement(value: unknown): VideoSectionPlacement {
  return VIDEO_SECTION_PLACEMENTS.some((p) => p.value === value)
    ? (value as VideoSectionPlacement)
    : DEFAULT_VIDEO_PLACEMENT
}

export type VideoSectionSettings = {
  title: string
  subtitle: string
  placement: VideoSectionPlacement
  instagramUrl: string
}

export const MAX_SHOPPABLE_VIDEOS = 8

// Section copy is entirely admin-managed (Admin > Video Section): an empty
// heading simply means no heading is shown.
export function videoSectionSettingsFromRow(settings: any): VideoSectionSettings {
  const source = settings?.announcements?.video_section || {}

  return {
    title: String(source.title || ''),
    subtitle: String(source.subtitle || ''),
    placement: normalizeVideoPlacement(source.placement),
    instagramUrl: String(source.instagram_url || ''),
  }
}

export type HomeShoppableVideo = {
  id: string
  title: string | null
  video_url: string | null
  external_url: string | null
  poster_url: string | null
  product: {
    id: string
    name: string
    href: string
    price: number
    oldPrice: number | null
    image_url: string
    variantName: string | null
  }
}

export const SHOPPABLE_VIDEO_PRODUCT_SELECT = `
  id, name, slug, is_active, price, "oldPrice", featured_image_url,
  product_images ( image_url ),
  product_variants ( id, variant_name, price, original_price, stock_quantity, is_active )
`

// Live videos for the storefront: active, with an active mapped product.
export async function getHomeShoppableVideos(adminClient: any): Promise<HomeShoppableVideo[]> {
  const { data, error } = await adminClient
    .from('shoppable_videos')
    .select(`id, title, video_url, external_url, poster_url, display_order, products:product_id ( ${SHOPPABLE_VIDEO_PRODUCT_SELECT} )`)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    // Table not migrated yet / transient failure — the section just doesn't render.
    console.error('getHomeShoppableVideos error:', error.message)
    return []
  }

  const videos: HomeShoppableVideo[] = []
  for (const row of data || []) {
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    if (!product || product.is_active === false || (!row.video_url && !row.external_url)) continue

    const variant = selectDisplayVariant(product.product_variants)
    const price = Number(product.price || variant?.price || 0)
    const original = product.oldPrice
      ? Number(product.oldPrice)
      : variant?.original_price
        ? Number(variant.original_price)
        : null

    videos.push({
      id: row.id,
      title: row.title,
      video_url: row.video_url ?? null,
      external_url: row.external_url ?? null,
      poster_url: row.poster_url,
      product: {
        id: product.id,
        name: product.name,
        href: `/shop/${product.slug || product.id}`,
        price,
        oldPrice: original !== null && original > price ? original : null,
        image_url: product.featured_image_url || product.product_images?.[0]?.image_url || '',
        variantName: null,
      },
    })
  }

  return videos
}
