'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import { deleteFromImageKit, isImageKitConfigured } from '@/lib/imagekit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ActionResult = {
  error?: string
  success?: boolean
}

function extractPublicId(url: string): string | null {
  if (!url) return null
  if (url.includes('ik.imagekit.io')) {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname.replace(/^\/[^/]+\//, '')
    } catch {
      return null
    }
  }
  if (url.startsWith('https://res.cloudinary.com/')) {
    const uploadIndex = url.indexOf('/image/upload/')
    if (uploadIndex === -1) return null
    let rest = url.slice(uploadIndex + '/image/upload/'.length)
    rest = rest.replace(/^v\d+\//, '')
    const publicId = rest.replace(/\.[a-zA-Z0-9]+$/, '')
    return publicId.replace(/_w(400|800|1200|1600)$/, '')
  }
  return null
}

export async function processAndUploadProductImageVariants(
  source: string | Buffer,
  _basePublicId: string
): Promise<string[]> {
  // ImageKit automatically optimizes and serves responsive images via CDN
  if (typeof source === 'string') {
    return [source]
  }
  return []
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type ProductVariantInput = {
  variant_name: string
  price: number
  original_price: number | null
  stock_quantity: number
  is_active: boolean
}

type ProductVariantIdentity = {
  id: string
  variant_name: string
}

type ProductColorInput = {
  name: string
  hex?: string
}

function normalizeVariantName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

function parseProductColorNames(colorName: string | null): string[] {
  if (!colorName) return []

  try {
    if (colorName.startsWith('[')) {
      const parsed = JSON.parse(colorName) as ProductColorInput[]

      return parsed
        .map(color => color.name?.trim())
        .filter((name): name is string => Boolean(name))
    }
  } catch (error) {
    return []
  }

  return colorName
    .split(',')
    .map(color => color.trim())
    .filter(Boolean)
}

function uniqueVariantsByName(variants: ProductVariantInput[]): ProductVariantInput[] {
  const byName = new Map<string, ProductVariantInput>()

  for (const variant of variants) {
    const variantName = variant.variant_name.trim()
    const normalizedName = normalizeVariantName(variantName)

    if (!normalizedName) continue
    byName.set(normalizedName, { ...variant, variant_name: variantName })
  }

  return Array.from(byName.values())
}

function createDefaultSizeVariants(
  basePrice: number,
  oldPrice: number | null,
  colorNames: string[],
  stock: number = 10
): ProductVariantInput[] {
  const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
  const sizes = SIZES.map((s) => ({
    variant_name: s,
    price: basePrice,
    original_price: oldPrice,
    stock_quantity: stock,
    is_active: true,
  }))

  if (colorNames.length === 0) {
    return sizes
  }

  return colorNames.flatMap(colorName =>
    sizes.map(size => ({
      ...size,
      variant_name: `${colorName} - ${size.variant_name}`,
      stock_quantity: stock,
    }))
  )
}

export async function syncCategoryProductCounts(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const { data: prods } = await supabase
      .from('products')
      .select('id, category_id, is_active')
      .eq('is_active', true)

    const { data: cats } = await supabase
      .from('categories')
      .select('id, slug')

    if (!cats || cats.length === 0) return

    for (const cat of cats) {
      const matchCount = (prods || []).filter(
        (p: any) => p.category_id === cat.id || (cat.slug && p.category_id === cat.slug)
      ).length
      const countStr = `${matchCount} ${matchCount === 1 ? 'style' : 'styles'}`
      await supabase
        .from('categories')
        .update({ count: countStr })
        .eq('id', cat.id)
    }
  } catch (err) {
    console.error('Error syncing category counts:', err)
  }
}

async function revalidateProductPaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string
) {
  await syncCategoryProductCounts(supabase)

  revalidatePath('/admin/products')
  revalidatePath('/admin/products', 'page')
  revalidatePath('/admin/categories')
  revalidatePath('/admin/categories', 'page')
  revalidatePath(`/admin/products/${productId}/edit`)
  revalidatePath('/shop')
  revalidatePath('/shop', 'page')
  revalidatePath(`/shop/${productId}`)
  revalidatePath('/')
  revalidatePath('/', 'page')

  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', productId)
    .single()

  if (product?.slug) {
    revalidatePath(`/shop/${product.slug}`)
  }
}

// Resolves the color_group_id to store for a product, given the "group with"
// selection from the admin form (another product's ID to share colors with).
async function resolveColorGroupId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupWithProductId: string | null
): Promise<string | null> {
  if (!groupWithProductId) return null

  const { data: target } = await supabase
    .from('products')
    .select('id, color_group_id')
    .eq('id', groupWithProductId)
    .single()

  if (!target) return null

  if (target.color_group_id) return target.color_group_id

  // Target isn't in a group yet — create one and backfill it onto the target.
  const newGroupId = crypto.randomUUID()
  await supabase
    .from('products')
    .update({ color_group_id: newGroupId })
    .eq('id', target.id)

  return newGroupId
}

export async function createProduct(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const name = formData.get('name') as string
  const categoryId = formData.get('category_id') as string
  const shortDescription = formData.get('short_description') as string
  const featuresJson = formData.get('features_json') as string
  const description = formData.get('description') as string
  const fabric = formData.get('fabric') as string
  const stitching = formData.get('stitching') as string
  const seoTitle = formData.get('seo_title') as string
  const seoDescription = formData.get('seo_description') as string
  const seoKeywords = formData.get('seo_keywords') as string
  const badge = formData.get('badge') as string
  const colorName = formData.get('color_name') as string
  const isActive = formData.has('is_active_submitted')
    ? (formData.get('is_active') === 'on' || formData.get('is_active') === 'true')
    : (formData.get('is_active') === 'on' || formData.get('is_active') === 'true' || !formData.has('is_active'))
  const isFeatured = formData.get('is_featured') === 'on' || formData.get('is_featured') === 'true'
  const imageUrl = formData.get('image_url') as string
  const cloudinaryPublicId = formData.get('cloudinary_public_id') as string
  const price = formData.get('price') as string
  const oldPrice = formData.get('oldPrice') as string
  const useGlobalSizeChart = formData.get('use_global_size_chart') === 'true'
  const sizeChartImageUrl = formData.get('size_chart_image_url') as string
  const sizeChartCloudinaryId = formData.get('size_chart_cloudinary_public_id') as string

  if (!name) {
    return { error: 'Product name is required' }
  }
  if (!price) {
    return { error: 'Base price is required' }
  }

  let featuresArray: string[] = []
  try {
    if (featuresJson) {
      const parsed = JSON.parse(featuresJson)
      if (Array.isArray(parsed)) {
        featuresArray = parsed.map((s: any) => String(s).trim()).filter(Boolean)
      }
    }
  } catch {}

  const finalShortDescription = shortDescription ? shortDescription.trim() : null

  let primaryColorHex: string | null = null
  try {
    if (colorName && colorName.startsWith('[')) {
      const parsedColors = JSON.parse(colorName)
      if (Array.isArray(parsedColors) && parsedColors[0]?.hex) {
        primaryColorHex = parsedColors[0].hex
      }
    }
  } catch {}

  const slug = slugify(name)
  const id = crypto.randomUUID()

  const { data: product, error } = await supabase.from('products').insert({
    id,
    name,
    slug,
    category_id: categoryId || null,
    price: parseFloat(price),
    oldPrice: oldPrice ? parseFloat(oldPrice) : null,
    short_description: finalShortDescription,
    description: description || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    seo_keywords: seoKeywords || null,
    badge: badge || null,
    color_name: colorName || null,
    color_hex: primaryColorHex || null,
    color_group_id: null,
    is_active: isActive,
    is_featured: isFeatured,
    featured_image_url: imageUrl || null,
    use_global_size_chart: useGlobalSizeChart,
    size_chart_image_url: useGlobalSizeChart ? null : (sizeChartImageUrl || null),
    size_chart_cloudinary_public_id: useGlobalSizeChart ? null : (sizeChartCloudinaryId || null),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select('id').single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A product with this name already exists' }
    }
    return { error: error.message }
  }

  // Save features to product_information table with label 'Key Feature'
  if (featuresArray.length > 0) {
    await supabase.from('product_information').insert(
      featuresArray.map((feat, idx) => ({
        product_id: id,
        label: 'Key Feature',
        value: feat,
        display_order: idx,
      }))
    )
  }

  // Insert default specifications into product_information table
  const defaultSpecifications = [
    { product_id: id, label: 'Fabric Details', value: '380 GSM Heavyweight Cotton Fleece', display_order: 0 },
    { product_id: id, label: 'Fit Profile', value: 'Oversized Streetwear Boxy Silhouette', display_order: 1 },
    { product_id: id, label: 'Stitching Details', value: 'Double-needle reinforced seams', display_order: 2 },
    { product_id: id, label: 'Care Instructions', value: 'Machine wash cold inside out, tumble dry low', display_order: 3 },
    { product_id: id, label: 'Country of Origin', value: 'Crafted with Pride in India', display_order: 4 },
  ]
  await supabase.from('product_information').insert(defaultSpecifications)

  // Add the primary image to product_images table so it appears in the gallery
  if (imageUrl) {
    const finalPublicId = cloudinaryPublicId || extractPublicId(imageUrl)

    await supabase.from('product_images').insert({
      product_id: id,
      image_url: imageUrl,
      cloudinary_public_id: finalPublicId || null,
      sort_order: 0,
      color_name: null,
    })
  }

  const basePrice = parseFloat(price)
  const numOldPrice = oldPrice ? parseFloat(oldPrice) : null
  const initialStockRaw = formData.get('initial_stock') as string
  const initialStock = initialStockRaw !== null && initialStockRaw !== undefined && initialStockRaw !== ''
    ? Math.max(0, parseInt(initialStockRaw, 10) || 0)
    : 10
  const colorNames = parseProductColorNames(colorName)
  const sizeVariants = createDefaultSizeVariants(basePrice, numOldPrice, colorNames, initialStock)

  await supabase.from('product_variants').insert(
    sizeVariants.map(v => ({ product_id: id, ...v }))
  )

  await revalidateProductPaths(supabase, id)
  redirect(`/admin/products/${product.id}/edit?created=true`)
}

export async function updateProduct(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const categoryId = formData.get('category_id') as string
  const shortDescription = formData.get('short_description') as string
  const featuresJson = formData.get('features_json') as string
  const description = formData.get('description') as string
  const fabric = formData.get('fabric') as string
  const stitching = formData.get('stitching') as string
  const seoTitle = formData.get('seo_title') as string
  const seoDescription = formData.get('seo_description') as string
  const seoKeywords = formData.get('seo_keywords') as string
  const badge = formData.get('badge') as string
  const colorName = formData.get('color_name') as string
  const isActive = formData.has('is_active_submitted')
    ? (formData.get('is_active') === 'on' || formData.get('is_active') === 'true')
    : (formData.get('is_active') === 'on' || formData.get('is_active') === 'true')
  const isFeatured = formData.get('is_featured') === 'on' || formData.get('is_featured') === 'true'
  const imageUrl = formData.get('image_url') as string
  const cloudinaryPublicId = formData.get('cloudinary_public_id') as string
  const price = formData.get('price') as string
  const oldPrice = formData.get('oldPrice') as string
  const useGlobalSizeChart = formData.get('use_global_size_chart') === 'true'
  const sizeChartImageUrl = formData.get('size_chart_image_url') as string
  const sizeChartCloudinaryId = formData.get('size_chart_cloudinary_public_id') as string

  if (!id || !name) {
    return { error: 'Product ID and name are required' }
  }
  if (!price) {
    return { error: 'Base price is required' }
  }

  let featuresArray: string[] = []
  try {
    if (featuresJson) {
      const parsed = JSON.parse(featuresJson)
      if (Array.isArray(parsed)) {
        featuresArray = parsed.map((s: any) => String(s).trim()).filter(Boolean)
      }
    }
  } catch {}

  const finalShortDescription = shortDescription ? shortDescription.trim() : null

  let primaryColorHex: string | null = null
  try {
    if (colorName && colorName.startsWith('[')) {
      const parsedColors = JSON.parse(colorName)
      if (Array.isArray(parsedColors) && parsedColors[0]?.hex) {
        primaryColorHex = parsedColors[0].hex
      }
    }
  } catch {}

  const slug = slugify(name)

  const updatePayload: Record<string, any> = {
    name,
    slug,
    category_id: categoryId || null,
    price: parseFloat(price),
    oldPrice: oldPrice ? parseFloat(oldPrice) : null,
    short_description: finalShortDescription,
    description: description || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    seo_keywords: seoKeywords || null,
    badge: badge || null,
    color_name: colorName || null,
    color_hex: primaryColorHex || null,
    color_group_id: null,
    is_active: isActive,
    is_featured: isFeatured,
    featured_image_url: imageUrl || null,
    use_global_size_chart: useGlobalSizeChart,
    size_chart_image_url: useGlobalSizeChart ? null : (sizeChartImageUrl || null),
    size_chart_cloudinary_public_id: useGlobalSizeChart ? null : (sizeChartCloudinaryId || null),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'A product with this name already exists' }
    }
    return { error: error.message }
  }

  // Sync Key Features in product_information table
  await supabase
    .from('product_information')
    .delete()
    .eq('product_id', id)
    .eq('label', 'Key Feature')

  if (featuresArray.length > 0) {
    await supabase.from('product_information').insert(
      featuresArray.map((feat, idx) => ({
        product_id: id,
        label: 'Key Feature',
        value: feat,
        display_order: idx,
      }))
    )
  }

  // Sync featured image with product_images table
  if (imageUrl) {
    const finalPublicId = cloudinaryPublicId || extractPublicId(imageUrl)
    const { data: existingImg } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', id)
      .eq('image_url', imageUrl)
      .maybeSingle()

    if (!existingImg) {
      await supabase.from('product_images').insert({
        product_id: id,
        image_url: imageUrl,
        cloudinary_public_id: finalPublicId || null,
        sort_order: 0,
        color_name: null,
      })
    }
  }

  // Update default variant price to match base price & MRP
  await supabase
    .from('product_variants')
    .update({
      price: parseFloat(price),
      original_price: oldPrice ? parseFloat(oldPrice) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('product_id', id)
    .eq('variant_name', 'Default')

  await revalidateProductPaths(supabase, id)
  return { success: true }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  await syncCategoryProductCounts(supabase)

  revalidatePath('/admin/products')
  revalidatePath('/admin/categories')
  revalidatePath('/shop')
  revalidatePath('/')
  return { success: true }
}

// ─── Product Information CRUD ────────────────────────────

export async function saveProductInformation(
  productId: string,
  items: { id?: string; label: string; value: string; display_order: number }[]
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  // Delete existing specifications (keep 'Key Feature' items safe)
  const { error: deleteError } = await supabase
    .from('product_information')
    .delete()
    .eq('product_id', productId)
    .neq('label', 'Key Feature')

  if (deleteError) {
    return { error: deleteError.message }
  }

  const validItems = items.filter(
    (item) => item.label && item.label.trim() && item.value && item.value.trim()
  )

  if (validItems.length > 0) {
    const rows = validItems.map((item, index) => ({
      product_id: productId,
      label: item.label.trim(),
      value: item.value.trim(),
      display_order: index,
    }))

    const { error: insertError } = await supabase
      .from('product_information')
      .insert(rows)

    if (insertError) {
      return { error: insertError.message }
    }
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

// ─── Product Image CRUD ────────────────────────────────────

export async function addProductImage(
  productId: string,
  imageUrl: string,
  colorName?: string | null,
  cloudinaryPublicId?: string | null
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const finalPublicId = cloudinaryPublicId || extractPublicId(imageUrl)

  // Get max sort_order
  const { data: maxSort } = await supabase
    .from('product_images')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSort = maxSort ? maxSort.sort_order + 1 : 0

  const { error } = await supabase.from('product_images').insert({
    product_id: productId,
    image_url: imageUrl,
    cloudinary_public_id: finalPublicId || null,
    sort_order: nextSort,
    color_name: colorName || null,
  })

  if (error) {
    return { error: error.message }
  }

  // If this is the only image, automatically set it as featured
  if (nextSort === 0) {
    await supabase
      .from('products')
      .update({ featured_image_url: imageUrl })
      .eq('id', productId)
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

export async function deleteProductImage(imageId: string, productId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  // Check if this is the featured image before deleting
  const { data: image } = await supabase
    .from('product_images')
    .select('image_url, cloudinary_public_id')
    .eq('id', imageId)
    .single()

  const publicId = image?.cloudinary_public_id || (image?.image_url ? extractPublicId(image.image_url) : null)

  if (publicId && isImageKitConfigured()) {
    try {
      await deleteFromImageKit(publicId)
    } catch (error: any) {
      console.warn('Failed to delete image from ImageKit:', error?.message)
    }
  }

  const { error } = await supabase.from('product_images').delete().eq('id', imageId)

  if (error) {
    return { error: error.message }
  }

  // If we just deleted the featured image, clear it or set to next available
  if (image) {
    const { data: product } = await supabase
      .from('products')
      .select('featured_image_url')
      .eq('id', productId)
      .single()
      
    if (product?.featured_image_url === image.image_url) {
      // Find another image to feature
      const { data: nextImage } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single()
        
      await supabase
        .from('products')
        .update({ featured_image_url: nextImage ? nextImage.image_url : null })
        .eq('id', productId)
    }
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

export async function setFeaturedImage(
  productId: string,
  imageUrl: string
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('products')
    .update({ featured_image_url: imageUrl })
    .eq('id', productId)

  if (error) {
    return { error: error.message }
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

export async function reorderProductImages(
  productId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from('product_images')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('product_id', productId)
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

export async function updateProductImageColor(
  imageId: string,
  productId: string,
  colorName: string
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient
  const { error } = await supabase
    .from('product_images')
    .update({ color_name: colorName.trim() || null })
    .eq('id', imageId)

  if (error) {
    return { error: error.message }
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

// ─── Product Variant CRUD ────────────────────────────────

export async function createProductVariant(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const productId = formData.get('product_id') as string
  const variantName = formData.get('variant_name') as string
  const price = formData.get('price') as string
  const originalPrice = formData.get('original_price') as string
  const stockQuantity = formData.get('stock_quantity') as string
  const isActive = formData.get('is_active') === 'on'

  if (!productId || !variantName.trim() || !price) {
    return { error: 'Product ID, Variant Name, and Price are required' }
  }

  const normalizedVariantName = normalizeVariantName(variantName)
  const { data: existingVariants, error: existingError } = await supabase
    .from('product_variants')
    .select('id, variant_name')
    .eq('product_id', productId)

  if (existingError) {
    return { error: existingError.message }
  }

  const matchingVariants = (existingVariants || []).filter(
    (variant: ProductVariantIdentity) => normalizeVariantName(variant.variant_name) === normalizedVariantName
  )

  const payload = {
    variant_name: variantName.trim(),
    price: parseFloat(price),
    original_price: originalPrice ? parseFloat(originalPrice) : null,
    stock_quantity: parseInt(stockQuantity || '0', 10),
    is_active: isActive,
  }

  if (matchingVariants.length > 0) {
    const [primaryVariant, ...duplicateVariants] = matchingVariants
    const { error } = await supabase
      .from('product_variants')
      .update(payload)
      .eq('id', primaryVariant.id)
      .eq('product_id', productId)

    if (error) {
      return { error: error.message }
    }

    if (duplicateVariants.length > 0) {
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('id', duplicateVariants.map((variant: ProductVariantIdentity) => variant.id))

      if (deleteError) {
        return { error: deleteError.message }
      }
    }
  } else {
    const { error } = await supabase.from('product_variants').insert({
      product_id: productId,
      ...payload,
    })

    if (error) {
      return { error: error.message }
    }
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

export async function bulkCreateProductVariants(
  productId: string,
  variants: ProductVariantInput[]
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const uniqueVariants = uniqueVariantsByName(variants)

  if (!productId || uniqueVariants.length === 0) {
    return { error: 'Invalid data' }
  }

  const { data: existingVariants, error: existingError } = await supabase
    .from('product_variants')
    .select('id, variant_name')
    .eq('product_id', productId)

  if (existingError) {
    return { error: existingError.message }
  }

  const duplicateIdsToDelete: string[] = []
  const rowsToInsert: Array<ProductVariantInput & { product_id: string }> = []

  for (const variant of uniqueVariants) {
    const normalizedVariantName = normalizeVariantName(variant.variant_name)
    const matchingVariants = (existingVariants || []).filter(
      (existingVariant: ProductVariantIdentity) =>
        normalizeVariantName(existingVariant.variant_name) === normalizedVariantName
    )

    if (matchingVariants.length > 0) {
      const [primaryVariant, ...duplicateVariants] = matchingVariants
      const { error } = await supabase
        .from('product_variants')
        .update(variant)
        .eq('id', primaryVariant.id)
        .eq('product_id', productId)

      if (error) {
        return { error: error.message }
      }

      duplicateIdsToDelete.push(
        ...duplicateVariants.map((duplicateVariant: ProductVariantIdentity) => duplicateVariant.id)
      )
    } else {
      rowsToInsert.push({
        product_id: productId,
        ...variant,
      })
    }
  }

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from('product_variants').insert(rowsToInsert)

    if (error) {
      return { error: error.message }
    }
  }

  if (duplicateIdsToDelete.length > 0) {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .in('id', duplicateIdsToDelete)

    if (error) {
      return { error: error.message }
    }
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

export async function updateProductVariant(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const id = formData.get('id') as string
  const productId = formData.get('product_id') as string
  const variantName = formData.get('variant_name') as string
  const price = formData.get('price') as string
  const originalPrice = formData.get('original_price') as string
  const stockQuantity = formData.get('stock_quantity') as string
  const isActive = formData.get('is_active') === 'on'

  if (!id || !productId || !variantName.trim() || !price) {
    return { error: 'Variant ID, Product ID, Name, and Price are required' }
  }

  const { data: existingVariants, error: existingError } = await supabase
    .from('product_variants')
    .select('id, variant_name')
    .eq('product_id', productId)

  if (existingError) {
    return { error: existingError.message }
  }

  const currentVariant = (existingVariants || []).find(
    (variant: ProductVariantIdentity) => variant.id === id
  )

  if (!currentVariant) {
    return { error: 'Variant not found' }
  }

  const oldVariantName = normalizeVariantName(currentVariant.variant_name)
  const newVariantName = normalizeVariantName(variantName)
  const duplicateIdsToDelete = (existingVariants || [])
    .filter((variant: ProductVariantIdentity) => {
      if (variant.id === id) return false

      const normalizedVariantName = normalizeVariantName(variant.variant_name)
      return normalizedVariantName === oldVariantName || normalizedVariantName === newVariantName
    })
    .map((variant: ProductVariantIdentity) => variant.id)

  const { error } = await supabase
    .from('product_variants')
    .update({
      variant_name: variantName.trim(),
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      stock_quantity: parseInt(stockQuantity || '0', 10),
      is_active: isActive,
    })
    .eq('id', id)
    .eq('product_id', productId)

  if (error) {
    return { error: error.message }
  }

  if (duplicateIdsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('product_variants')
      .delete()
      .in('id', duplicateIdsToDelete)

    if (deleteError) {
      return { error: deleteError.message }
    }
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

export async function deleteProductVariant(
  id: string,
  productId: string
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const { data: existingVariants, error: existingError } = await supabase
    .from('product_variants')
    .select('id, variant_name')
    .eq('product_id', productId)

  if (existingError) {
    return { error: existingError.message }
  }

  const currentVariant = (existingVariants || []).find(
    (variant: ProductVariantIdentity) => variant.id === id
  )

  if (!currentVariant) {
    return { success: true }
  }

  const normalizedVariantName = normalizeVariantName(currentVariant.variant_name)
  const variantIdsToDelete = (existingVariants || [])
    .filter(
      (variant: ProductVariantIdentity) =>
        normalizeVariantName(variant.variant_name) === normalizedVariantName
    )
    .map((variant: ProductVariantIdentity) => variant.id)

  const { error } = await supabase
    .from('product_variants')
    .delete()
    .in('id', variantIdsToDelete)

  if (error) {
    return { error: error.message }
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}


export async function saveProductFaqs(
  productId: string,
  items: { id?: string; question: string; answer: string; display_order: number }[]
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  // Delete existing FAQs and re-insert
  const { error: deleteError } = await supabase
    .from('product_faqs')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  if (items.length > 0) {
    const rows = items.map((item, index) => ({
      product_id: productId,
      question: item.question,
      answer: item.answer,
      display_order: index,
    }))

    const { error: insertError } = await supabase
      .from('product_faqs')
      .insert(rows)

    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}

export async function updateVariantsStockByColor(
  productId: string,
  colorName: string,
  stockQuantity: number
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  if (!productId || !colorName?.trim()) {
    return { error: 'Product ID and Color Name are required' }
  }

  const validStock = Math.max(0, parseInt(stockQuantity?.toString() || '0', 10) || 0)
  const normalizedColor = colorName.trim().toLowerCase()

  // 1. Fetch all variants of this product
  const { data: variants, error: fetchErr } = await supabase
    .from('product_variants')
    .select('id, variant_name, price, original_price')
    .eq('product_id', productId)

  if (fetchErr) {
    return { error: fetchErr.message }
  }

  // Find variants matching this color
  const matchingVariants = (variants || []).filter((v: any) => {
    const vName = (v.variant_name || '').toLowerCase()
    return vName.includes(normalizedColor)
  })

  if (matchingVariants.length > 0) {
    const ids = matchingVariants.map((v: any) => v.id)
    const { error: updateErr } = await supabase
      .from('product_variants')
      .update({ stock_quantity: validStock })
      .in('id', ids)

    if (updateErr) {
      return { error: updateErr.message }
    }
  } else {
    // If no variants exist with color prefix, check if all variants are general sizes (e.g. S, M, L)
    const generalVariants = (variants || []).filter((v: any) => !v.variant_name.includes(' - '))
    if (generalVariants.length > 0 && (variants || []).length === generalVariants.length) {
      const ids = generalVariants.map((v: any) => v.id)
      const { error: updateErr } = await supabase
        .from('product_variants')
        .update({ stock_quantity: validStock })
        .in('id', ids)

      if (updateErr) {
        return { error: updateErr.message }
      }
    } else {
      // Create standard size variants for this color if none exist
      const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
      const { data: prod } = await supabase
        .from('products')
        .select('price, "oldPrice"')
        .eq('id', productId)
        .single()

      const basePrice = prod?.price || 1999
      const baseOldPrice = prod?.oldPrice || null

      const newVariants = STANDARD_SIZES.map((size) => ({
        id: crypto.randomUUID(),
        product_id: productId,
        variant_name: `${colorName.trim()} - ${size}`,
        price: basePrice,
        original_price: baseOldPrice,
        stock_quantity: validStock,
        is_active: true,
      }))

      const { error: insertErr } = await supabase
        .from('product_variants')
        .insert(newVariants)

      if (insertErr) {
        return { error: insertErr.message }
      }
    }
  }

  // Also update product's color_name JSON with this stock value
  const { data: prod } = await supabase
    .from('products')
    .select('color_name')
    .eq('id', productId)
    .single()

  if (prod?.color_name) {
    try {
      if (prod.color_name.startsWith('[')) {
        const parsed = JSON.parse(prod.color_name) as { name: string; hex: string; stock?: number }[]
        const updated = parsed.map((c) =>
          c.name.toLowerCase() === normalizedColor
            ? { ...c, stock: validStock }
            : c
        )
        await supabase
          .from('products')
          .update({ color_name: JSON.stringify(updated) })
          .eq('id', productId)
      }
    } catch {}
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

export async function bulkUpdateVariantsStock(
  productId: string,
  stockQuantity: number,
  colorFilter?: string | null
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  if (!productId) {
    return { error: 'Product ID is required' }
  }

  const validStock = Math.max(0, parseInt(stockQuantity?.toString() || '0', 10) || 0)

  // 1. Fetch variants
  const { data: variants, error: fetchErr } = await supabase
    .from('product_variants')
    .select('id, variant_name')
    .eq('product_id', productId)

  if (fetchErr) {
    return { error: fetchErr.message }
  }

  let targetVariants = variants || []
  if (colorFilter && colorFilter !== 'All' && colorFilter !== 'General') {
    const norm = colorFilter.trim().toLowerCase()
    targetVariants = targetVariants.filter((v: any) => {
      const vName = (v.variant_name || '').toLowerCase()
      return vName.includes(norm)
    })
  }

  if (targetVariants.length > 0) {
    const ids = targetVariants.map((v: any) => v.id)
    const { error: updateErr } = await supabase
      .from('product_variants')
      .update({ stock_quantity: validStock })
      .in('id', ids)

    if (updateErr) {
      return { error: updateErr.message }
    }
  }

  // Also update product's color_name JSON if applicable
  const { data: prod } = await supabase
    .from('products')
    .select('color_name')
    .eq('id', productId)
    .single()

  if (prod?.color_name) {
    try {
      if (prod.color_name.startsWith('[')) {
        const parsed = JSON.parse(prod.color_name) as { name: string; hex: string; stock?: number }[]
        const updated = parsed.map((c) => {
          if (!colorFilter || colorFilter === 'All' || colorFilter === 'General' || c.name.toLowerCase() === colorFilter.toLowerCase()) {
            return { ...c, stock: validStock }
          }
          return c
        })
        await supabase
          .from('products')
          .update({ color_name: JSON.stringify(updated) })
          .eq('id', productId)
      }
    } catch {}
  }

  await revalidateProductPaths(supabase, productId)
  return { success: true }
}

