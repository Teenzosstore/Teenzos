'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/adminAuth'
import { uploadToImageKit, deleteFromImageKit, isImageKitConfigured } from '@/lib/imagekit'
import { revalidatePath } from 'next/cache'

export type ActionResult = {
  error?: string
  success?: boolean
  data?: any
}

// Resolves a size_charts row (or the legacy single-image shape) to a
// guaranteed, non-empty `image_urls` array — handles rows written before the
// multi-image migration, where only `image_url` was ever set.
function withImageUrls<T extends { image_url?: string | null; image_urls?: string[] | null }>(
  row: T
): T & { image_urls: string[] } {
  const image_urls =
    row.image_urls && row.image_urls.length > 0
      ? row.image_urls
      : row.image_url
      ? [row.image_url]
      : []
  return { ...row, image_urls }
}

export async function getGlobalSizeChart(): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const { data, error } = await supabase
    .from('size_charts')
    .select('*')
    .eq('is_global', true)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'No global size chart found' }
    }
    return { error: error.message }
  }

  return { success: true, data: withImageUrls(data) }
}

export async function getAllSizeCharts(): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) return { error: admin.error }
    const supabase = admin.adminClient

    const { data, error } = await supabase
      .from('size_charts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { success: true, data: (data || []).map(withImageUrls) }
  } catch (e: any) {
    console.error('getAllSizeCharts error:', e)
    return { error: e?.message || 'Failed to fetch size charts' }
  }
}

// Creates or updates a NAMED, reusable chart in the library (is_global: false).
// Products can pick one of these via size_chart_id — editing it here instantly
// updates every product that picked it.
export async function createOrUpdateLibraryChart(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const id = (formData.get('id') as string) || null
  const name = (formData.get('name') as string)?.trim() || 'Custom Chart'
  const isActive = formData.get('is_active') === 'on'

  let imageUrls: string[] = []
  let publicIds: string[] = []
  try {
    imageUrls = JSON.parse((formData.get('image_urls') as string) || '[]')
    publicIds = JSON.parse((formData.get('cloudinary_public_ids') as string) || '[]')
  } catch {
    return { error: 'Invalid image data submitted.' }
  }

  if (!imageUrls.length) {
    return { error: 'At least one image is required' }
  }

  const payload = {
    name,
    image_url: imageUrls[0],
    cloudinary_public_id: publicIds[0] || null,
    image_urls: imageUrls,
    cloudinary_public_ids: publicIds,
    is_active: isActive,
  }

  if (id) {
    // is_global is intentionally left out of the payload so editing a chart
    // here (including the current global one) never touches which chart is global.
    const { data: existing } = await supabase
      .from('size_charts')
      .select('cloudinary_public_ids')
      .eq('id', id)
      .single()

    if (existing?.cloudinary_public_ids?.length && isImageKitConfigured()) {
      const removed = existing.cloudinary_public_ids.filter((pid: string) => pid && !publicIds.includes(pid))
      for (const pid of removed) {
        try {
          await deleteFromImageKit(pid)
        } catch (e) {
          console.error('Failed to delete removed library chart image from ImageKit:', e)
        }
      }
    }

    const { error } = await supabase.from('size_charts').update(payload).eq('id', id)
    if (error) return { error: error.message }
  } else {
    // Safety net: if no global chart exists yet (e.g. a fresh install), the
    // first chart ever created becomes global so products always have a fallback.
    const { count } = await supabase
      .from('size_charts')
      .select('id', { count: 'exact', head: true })
      .eq('is_global', true)

    const { error } = await supabase.from('size_charts').insert({ ...payload, is_global: !count })
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/size-chart')
  revalidatePath('/shop', 'layout')
  return { success: true }
}

// Marks one chart as THE global/default fallback, unsetting whichever chart
// currently holds that role. Exactly one chart is global at a time.
export async function setGlobalSizeChart(id: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const { error: unsetError } = await supabase.from('size_charts').update({ is_global: false }).eq('is_global', true)
  if (unsetError) return { error: unsetError.message }

  const { error: setError } = await supabase.from('size_charts').update({ is_global: true }).eq('id', id)
  if (setError) return { error: setError.message }

  revalidatePath('/admin/size-chart')
  revalidatePath('/shop', 'layout')
  return { success: true }
}

export async function deleteSizeChart(id: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  // Don't allow deleting the global size chart
  const { data: chart } = await supabase
    .from('size_charts')
    .select('is_global, cloudinary_public_id, cloudinary_public_ids')
    .eq('id', id)
    .single()

  if (chart?.is_global) {
    return { error: 'Cannot delete the global size chart' }
  }

  // Delete all images (legacy single + multi) from ImageKit
  const idsToDelete = new Set<string>(chart?.cloudinary_public_ids || [])
  if (chart?.cloudinary_public_id) idsToDelete.add(chart.cloudinary_public_id)
  if (idsToDelete.size && isImageKitConfigured()) {
    for (const publicId of idsToDelete) {
      try {
        await deleteFromImageKit(publicId)
      } catch (e) {
        console.error('Failed to delete size chart image from ImageKit:', e)
      }
    }
  }

  const { error } = await supabase
    .from('size_charts')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/size-chart')
  return { success: true }
}

export async function uploadSizeChartImage(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }

  const file = formData.get('file') as File
  if (!file || file.size === 0) {
    return { error: 'No file provided' }
  }

  if (!isImageKitConfigured()) {
    return { error: 'ImageKit is not configured' }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await uploadToImageKit({
      file: buffer,
      fileName: file.name || `size-chart-${Date.now()}`,
      folder: '/rawflex/size-charts',
    })

    return {
      success: true,
      data: {
        image_url: result.url,
        cloudinary_public_id: result.fileId,
      },
    }
  } catch (error: any) {
    return { error: error?.message || 'Failed to upload image' }
  }
}

export async function getProductSizeChart(productId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  // First get the product's size chart settings
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('use_global_size_chart, size_chart_image_url, size_chart_cloudinary_public_id, size_chart_image_urls, size_chart_cloudinary_public_ids, size_chart_id')
    .eq('id', productId)
    .single()

  if (productError) {
    return { error: productError.message }
  }

  // Picked a named chart from the library — it stays in sync if that chart is edited later.
  if (product.size_chart_id) {
    const { data: libraryChart, error: libraryError } = await supabase
      .from('size_charts')
      .select('*')
      .eq('id', product.size_chart_id)
      .eq('is_active', true)
      .maybeSingle()

    if (libraryChart) {
      return { success: true, data: { ...withImageUrls(libraryChart), is_global: false } }
    }
    if (libraryError) {
      console.error('getProductSizeChart: library chart lookup failed', libraryError)
    }
    // Fall through to global/custom/disabled if the linked chart is gone or inactive.
  }

  // If size chart is explicitly disabled for this product
  if (
    product.use_global_size_chart === false &&
    !product.size_chart_id &&
    (!product.size_chart_image_url || product.size_chart_image_url === 'disabled')
  ) {
    return { error: 'Size chart is disabled for this product' }
  }

  // If using global size chart, fetch it
  if (product.use_global_size_chart) {
    const { data: globalChart, error: globalError } = await supabase
      .from('size_charts')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)
      .single()

    if (globalError) {
      if (globalError.code === 'PGRST116') {
        return { error: 'No global size chart configured' }
      }
      return { error: globalError.message }
    }

    return { success: true, data: { ...withImageUrls(globalChart), is_global: true } }
  }

  // Otherwise return product-specific size chart
  if (product.size_chart_image_url && product.size_chart_image_url !== 'disabled') {
    return {
      success: true,
      data: withImageUrls({
        id: productId,
        name: 'Product Specific Size Chart',
        image_url: product.size_chart_image_url,
        cloudinary_public_id: product.size_chart_cloudinary_public_id,
        image_urls: product.size_chart_image_urls,
        cloudinary_public_ids: product.size_chart_cloudinary_public_ids,
        is_global: false,
        is_active: true,
        created_at: '',
        updated_at: '',
      }),
    }
  }

  return { error: 'No size chart available for this product' }
}

// Public version that doesn't require admin authentication
export async function getProductSizeChartPublic(productId?: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient()

    // 1. If productId or slug provided, check product-specific size chart settings
    if (productId) {
      let query = supabase
        .from('products')
        .select('id, use_global_size_chart, size_chart_image_url, size_chart_cloudinary_public_id, size_chart_image_urls, size_chart_cloudinary_public_ids, size_chart_id')

      // If productId looks like UUID or regular string, check both id and slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
      if (isUUID) {
        query = query.eq('id', productId)
      } else {
        query = query.or(`id.eq.${productId},slug.eq.${productId}`)
      }

      const { data: product } = await query.maybeSingle()

      if (product) {
        // Picked a named chart from the library — stays in sync if it's edited later.
        if (product.size_chart_id) {
          const { data: libraryChart } = await supabase
            .from('size_charts')
            .select('*')
            .eq('id', product.size_chart_id)
            .eq('is_active', true)
            .maybeSingle()

          if (libraryChart) {
            return { success: true, data: { ...withImageUrls(libraryChart), is_global: false } }
          }
          // Linked chart missing/inactive — fall through to global/custom/disabled below.
        }

        // If disabled: use_global_size_chart is false and (no image or image === 'disabled')
        if (product.use_global_size_chart === false && !product.size_chart_id) {
          if (product.size_chart_image_url && product.size_chart_image_url !== 'disabled') {
            return {
              success: true,
              data: withImageUrls({
                id: product.id,
                name: 'Product Specific Size Chart',
                image_url: product.size_chart_image_url,
                cloudinary_public_id: product.size_chart_cloudinary_public_id,
                image_urls: product.size_chart_image_urls,
                cloudinary_public_ids: product.size_chart_cloudinary_public_ids,
                is_global: false,
                is_active: true,
                created_at: '',
                updated_at: '',
              }),
            }
          }
          // Size chart is explicitly disabled for this product!
          return { error: 'Size chart is disabled for this product' }
        }
      }
    }

    // 2. Otherwise fetch the active global size chart configured in admin
    const { data: globalChart } = await supabase
      .from('size_charts')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (globalChart && globalChart.image_url) {
      return { success: true, data: { ...withImageUrls(globalChart), is_global: true } }
    }

    // 3. Fallback to any active size chart
    const { data: anyChart } = await supabase
      .from('size_charts')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (anyChart && anyChart.image_url) {
      return { success: true, data: withImageUrls(anyChart) }
    }

    return { error: 'No size chart available' }
  } catch (err: any) {
    return { error: err?.message || 'Failed to fetch size chart' }
  }
}

export async function updateProductSizeChartSettings(
  productId: string,
  useGlobal: boolean,
  imageUrl?: string,
  cloudinaryPublicId?: string
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const updates: any = {
    use_global_size_chart: useGlobal,
  }

  if (!useGlobal) {
    if (!imageUrl) {
      return { error: 'Size chart image is required when not using global size chart' }
    }
    updates.size_chart_image_url = imageUrl
    updates.size_chart_cloudinary_public_id = cloudinaryPublicId || null
  } else {
    updates.size_chart_image_url = null
    updates.size_chart_cloudinary_public_id = null
  }

  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/products/${productId}/edit`)
  return { success: true }
}