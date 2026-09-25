'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ActionResult = {
  error?: string
  success?: boolean
}

const PRODUCT_IMAGE_VARIANT_WIDTHS = [400, 800, 1200, 1600] as const

function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.startsWith('https://res.cloudinary.com/')) return null
  const uploadIndex = url.indexOf('/image/upload/')
  if (uploadIndex === -1) return null

  let rest = url.slice(uploadIndex + '/image/upload/'.length)
  // Strip inline transforms if any
  if (rest.includes('/') && !rest.startsWith('v') && !rest.startsWith('rawflex/')) {
    const firstSlash = rest.indexOf('/')
    const segment = rest.slice(0, firstSlash)
    if (segment.includes(',') || segment.startsWith('w_') || segment.startsWith('c_') || segment.startsWith('f_')) {
      rest = rest.slice(firstSlash + 1)
    }
  }

  // Strip version tag
  rest = rest.replace(/^v\d+\//, '')
  // Strip extension
  const publicId = rest.replace(/\.[a-zA-Z0-9]+$/, '')
  return publicId.replace(/_w(400|800|1200|1600)$/, '')
}

export async function processAndUploadProductImageVariants(
  source: string | Buffer,
  basePublicId: string
): Promise<string[]> {
  if (!configureCloudinary()) {
    throw new Error('Cloudinary is not configured')
  }

  let inputBuffer: Buffer
  if (typeof source === 'string') {
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`Failed to fetch image source for optimization: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    inputBuffer = Buffer.from(arrayBuffer)
  } else {
    inputBuffer = source
  }

  const uploadedUrls: string[] = []

  // Approach A: Always generate all 4 filename slots (400, 800, 1200, 1600).
  // With withoutEnlargement: true, sharp preserves aspect ratio and will NOT upscale small images,
  // storing the largest available un-upscaled WebP at larger filename slots to guarantee zero 404s.
  for (const width of PRODUCT_IMAGE_VARIANT_WIDTHS) {
    // Rule 1, 3, 4: Scale proportionally, convert to WebP quality 82 from ORIGINAL buffer
    const resizedBuffer = await sharp(inputBuffer)
      .resize(width, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const variantPublicId = `${basePublicId}_w${width}`

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: variantPublicId,
          format: 'webp',
          resource_type: 'image',
          overwrite: true,
        },
        (error, uploadResult) => {
          if (error) reject(error)
          else resolve(uploadResult)
        }
      )
      uploadStream.end(resizedBuffer)
    })

    if (result?.secure_url) {
      uploadedUrls.push(result.secure_url)
    }
  }

  return uploadedUrls
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

function configureCloudinary() {
  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return false
  }

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  return true
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

function createDefaultSizeVariants(basePrice: number, colorNames: string[]): ProductVariantInput[] {
  const sizes = [
    { variant_name: 'S', price: basePrice, original_price: null, stock_quantity: 0, is_active: true },
    { variant_name: 'M', price: basePrice, original_price: null, stock_quantity: 0, is_active: true },
    { variant_name: 'L', price: basePrice, original_price: null, stock_quantity: 0, is_active: true },
    { variant_name: 'XL', price: basePrice, original_price: null, stock_quantity: 0, is_active: true },
  ]

  if (colorNames.length === 0) {
    return sizes
  }

  return colorNames.flatMap(colorName =>
    sizes.map(size => ({
      ...size,
      variant_name: `${colorName} - ${size.variant_name}`,
    }))
  )
}

async function revalidateProductPaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string
) {
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
  revalidatePath('/shop')
  revalidatePath(`/shop/${productId}`)
  revalidatePath('/')

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
  const description = formData.get('description') as string
  const fabric = formData.get('fabric') as string
  const stitching = formData.get('stitching') as string
  const seoTitle = formData.get('seo_title') as string
  const seoDescription = formData.get('seo_description') as string
  const seoKeywords = formData.get('seo_keywords') as string
  const badge = formData.get('badge') as string
  const colorName = formData.get('color_name') as string
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'
  const imageUrl = formData.get('image_url') as string
  const cloudinaryPublicId = formData.get('cloudinary_public_id') as string
  const price = formData.get('price') as string
  const useGlobalSizeChart = formData.get('use_global_size_chart') === 'true'
  const sizeChartImageUrl = formData.get('size_chart_image_url') as string
  const sizeChartCloudinaryId = formData.get('size_chart_cloudinary_public_id') as string

  if (!name) {
    return { error: 'Product name is required' }
  }
  if (!price) {
    return { error: 'Base price is required' }
  }

  const slug = slugify(name)
  const id = crypto.randomUUID()

  const { data: product, error } = await supabase.from('products').insert({
    id,
    name,
    slug,
    category_id: categoryId || null,
    price: parseFloat(price),
    short_description: shortDescription || null,
    description: description || null,
    fabric: fabric || null,
    stitching: stitching || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    seo_keywords: seoKeywords || null,
    badge: badge || null,
    color_name: colorName || null,
    color_hex: null,
    color_group_id: null,
    is_active: isActive,
    is_featured: isFeatured,
    featured_image_url: imageUrl || null,
    use_global_size_chart: useGlobalSizeChart,
    size_chart_image_url: useGlobalSizeChart ? null : (sizeChartImageUrl || null),
    size_chart_cloudinary_public_id: useGlobalSizeChart ? null : (sizeChartCloudinaryId || null),
  }).select('id').single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A product with this name already exists' }
    }
    return { error: error.message }
  }

  // Also add the image to product_images table so it appears in the gallery
  if (imageUrl) {
    const finalPublicId = cloudinaryPublicId || extractCloudinaryPublicId(imageUrl)
    if (imageUrl && finalPublicId && configureCloudinary()) {
      try {
        await processAndUploadProductImageVariants(imageUrl, finalPublicId)
      } catch (e) {
        console.error('Failed to generate product image WebP variants on createProduct:', e)
      }
    }

    await supabase.from('product_images').insert({
      product_id: id,
      image_url: imageUrl,
      cloudinary_public_id: finalPublicId || null,
      sort_order: 0,
      color_name: null,
    })
  }

  const basePrice = parseFloat(price)
  const colorNames = parseProductColorNames(colorName)
  const sizeVariants = createDefaultSizeVariants(basePrice, colorNames)

  await supabase.from('product_variants').insert(
    sizeVariants.map(v => ({ product_id: id, ...v }))
  )

  await revalidateProductPaths(supabase, id)
  redirect(`/admin/products/${product.id}/edit`)
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
  const description = formData.get('description') as string
  const fabric = formData.get('fabric') as string
  const stitching = formData.get('stitching') as string
  const seoTitle = formData.get('seo_title') as string
  const seoDescription = formData.get('seo_description') as string
  const seoKeywords = formData.get('seo_keywords') as string
  const badge = formData.get('badge') as string
  const colorName = formData.get('color_name') as string
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'
  const price = formData.get('price') as string
  const useGlobalSizeChart = formData.get('use_global_size_chart') === 'true'
  const sizeChartImageUrl = formData.get('size_chart_image_url') as string
  const sizeChartCloudinaryId = formData.get('size_chart_cloudinary_public_id') as string

  if (!id || !name) {
    return { error: 'Product ID and name are required' }
  }
  if (!price) {
    return { error: 'Base price is required' }
  }

  const slug = slugify(name)

  const { error } = await supabase
    .from('products')
    .update({
      name,
      slug,
      category_id: categoryId || null,
      price: parseFloat(price),
      short_description: shortDescription || null,
      description: description || null,
      fabric: fabric || null,
      stitching: stitching || null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      seo_keywords: seoKeywords || null,
      badge: badge || null,
      color_name: colorName || null,
      color_hex: null,
      color_group_id: null,
      is_active: isActive,
      is_featured: isFeatured,
      use_global_size_chart: useGlobalSizeChart,
      size_chart_image_url: useGlobalSizeChart ? null : (sizeChartImageUrl || null),
      size_chart_cloudinary_public_id: useGlobalSizeChart ? null : (sizeChartCloudinaryId || null),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'A product with this name already exists' }
    }
    return { error: error.message }
  }

  // Update default variant price to match base price
  await supabase
    .from('product_variants')
    .update({ price: parseFloat(price) })
    .eq('product_id', id)
    .eq('variant_name', 'Default')

  await revalidateProductPaths(supabase, id)
  redirect(`/admin/products/${id}/edit`)
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/products')
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

  // Delete existing items and re-insert
  const { error: deleteError } = await supabase
    .from('product_information')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  if (items.length > 0) {
    const rows = items.map((item, index) => ({
      product_id: productId,
      label: item.label,
      value: item.value,
      display_order: index,
    }))

    const { error: insertError } = await supabase
      .from('product_information')
      .insert(rows)

    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath(`/admin/products/${productId}`)
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

  const finalPublicId = cloudinaryPublicId || extractCloudinaryPublicId(imageUrl)

  if (imageUrl && finalPublicId && configureCloudinary()) {
    try {
      await processAndUploadProductImageVariants(imageUrl, finalPublicId)
    } catch (e) {
      console.error('Failed to generate product image WebP variants on addProductImage:', e)
    }
  }

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

  const publicId = image?.cloudinary_public_id || (image?.image_url ? extractCloudinaryPublicId(image.image_url) : null)

  if (publicId && !configureCloudinary()) {
    return { error: 'Cloudinary is not configured, so this image cannot be deleted safely.' }
  }

  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
      for (const w of PRODUCT_IMAGE_VARIANT_WIDTHS) {
        try {
          await cloudinary.uploader.destroy(`${publicId}_w${w}`, { resource_type: 'image' })
        } catch {}
      }
    } catch (error: any) {
      return { error: error?.message || 'Failed to delete image from Cloudinary' }
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
