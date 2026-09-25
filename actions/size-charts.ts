'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/adminAuth'
import { v2 as cloudinary } from 'cloudinary'
import { revalidatePath } from 'next/cache'

export type ActionResult = {
  error?: string
  success?: boolean
  data?: any
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

  return { success: true, data }
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

    return { success: true, data: data || [] }
  } catch (e: any) {
    console.error('getAllSizeCharts error:', e)
    return { error: e?.message || 'Failed to fetch size charts' }
  }
}

export async function createOrUpdateGlobalSizeChart(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  const name = formData.get('name') as string || 'Global Size Chart'
  const imageUrl = formData.get('image_url') as string
  const cloudinaryPublicId = formData.get('cloudinary_public_id') as string
  const isActive = formData.get('is_active') === 'on'

  if (!imageUrl) {
    return { error: 'Image URL is required' }
  }

  // Check if a global size chart already exists
  const { data: existing } = await supabase
    .from('size_charts')
    .select('id, cloudinary_public_id')
    .eq('is_global', true)
    .single()

  if (existing) {
    // Update existing global size chart
    // Delete old image from Cloudinary if it exists
    if (existing.cloudinary_public_id && configureCloudinary()) {
      try {
        await cloudinary.uploader.destroy(existing.cloudinary_public_id, { resource_type: 'image' })
      } catch (e) {
        console.error('Failed to delete old size chart from Cloudinary:', e)
      }
    }

    const { error } = await supabase
      .from('size_charts')
      .update({
        name,
        image_url: imageUrl,
        cloudinary_public_id: cloudinaryPublicId || null,
        is_active: isActive,
      })
      .eq('id', existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Create new global size chart
    const { error } = await supabase
      .from('size_charts')
      .insert({
        name,
        image_url: imageUrl,
        cloudinary_public_id: cloudinaryPublicId || null,
        is_global: true,
        is_active: isActive,
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/admin/size-chart')
  return { success: true }
}

export async function deleteSizeChart(id: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }
  const supabase = admin.adminClient

  // Don't allow deleting the global size chart
  const { data: chart } = await supabase
    .from('size_charts')
    .select('is_global, cloudinary_public_id')
    .eq('id', id)
    .single()

  if (chart?.is_global) {
    return { error: 'Cannot delete the global size chart' }
  }

  // Delete from Cloudinary if exists
  if (chart?.cloudinary_public_id && configureCloudinary()) {
    try {
      await cloudinary.uploader.destroy(chart.cloudinary_public_id, { resource_type: 'image' })
    } catch (e) {
      console.error('Failed to delete size chart from Cloudinary:', e)
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

  if (!configureCloudinary()) {
    return { error: 'Cloudinary is not configured' }
  }

  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'rawflex/size-charts',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
    })

    return {
      success: true,
      data: {
        image_url: result.secure_url,
        cloudinary_public_id: result.public_id,
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
    .select('use_global_size_chart, size_chart_image_url, size_chart_cloudinary_public_id')
    .eq('id', productId)
    .single()

  if (productError) {
    return { error: productError.message }
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

    return { success: true, data: { ...globalChart, is_global: true } }
  }

  // Otherwise return product-specific size chart
  if (product.size_chart_image_url) {
    return {
      success: true,
      data: {
        id: productId,
        name: 'Product Specific Size Chart',
        image_url: product.size_chart_image_url,
        cloudinary_public_id: product.size_chart_cloudinary_public_id,
        is_global: false,
        is_active: true,
        created_at: '',
        updated_at: '',
      }
    }
  }

  return { error: 'No size chart available for this product' }
}

// Public version that doesn't require admin authentication
export async function getProductSizeChartPublic(productId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // First get the product's size chart settings
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('use_global_size_chart, size_chart_image_url, size_chart_cloudinary_public_id')
    .eq('id', productId)
    .single()

  if (productError) {
    return { error: productError.message }
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

    return { success: true, data: { ...globalChart, is_global: true } }
  }

  // Otherwise return product-specific size chart
  if (product.size_chart_image_url) {
    return {
      success: true,
      data: {
        id: productId,
        name: 'Product Specific Size Chart',
        image_url: product.size_chart_image_url,
        cloudinary_public_id: product.size_chart_cloudinary_public_id,
        is_global: false,
        is_active: true,
        created_at: '',
        updated_at: '',
      }
    }
  }

  return { error: 'No size chart available for this product' }
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