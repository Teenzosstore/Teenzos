'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import {
  MAX_SHOPPABLE_VIDEOS,
  videoSectionSettingsFromRow,
  type VideoSectionPlacement,
  type VideoSectionSettings,
} from '@/lib/shoppableVideos'

export type AdminShoppableVideo = {
  id: string
  title: string | null
  video_url: string | null
  external_url: string | null
  poster_url: string | null
  product_id: string | null
  is_active: boolean
  display_order: number
  product: { id: string; name: string; featured_image_url: string | null; price: number | null } | null
}

export type ProductOption = {
  id: string
  name: string
  featured_image_url: string | null
  price: number | null
}

const MIGRATION_ERROR =
  'Supabase is missing the shoppable_videos table. Run sql/shoppable_videos.sql in the Supabase SQL editor, then try again.'

function friendlyError(error: any) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  if (
    message.includes('shoppable_videos') &&
    (message.includes('schema cache') || message.includes('does not exist'))
  ) {
    return MIGRATION_ERROR
  }
  return error?.message || 'Something went wrong while updating the video section.'
}

function revalidateVideoPaths() {
  revalidatePath('/')
  revalidatePath('/admin/video-section')
}

export async function getVideoSectionSettings(): Promise<VideoSectionSettings> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('settings')
      .select('announcements')
      .eq('id', 'site_settings')
      .maybeSingle()
    return videoSectionSettingsFromRow(data)
  } catch (e) {
    console.error('getVideoSectionSettings error:', e)
    return videoSectionSettingsFromRow(null)
  }
}

export async function updateVideoSectionSettings(fields: {
  title: string
  subtitle: string
  placement: VideoSectionPlacement
  instagramUrl?: string
}) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { data: settings } = await supabase
    .from('settings')
    .select('announcements')
    .eq('id', 'site_settings')
    .single()

  const existing = settings?.announcements
  const announcements = existing && !Array.isArray(existing) ? existing : { items: existing || [] }

  const videoSection = {
    title: fields.title.trim().slice(0, 80),
    subtitle: fields.subtitle.trim().slice(0, 200),
    placement: fields.placement === 'before_products' ? 'before_products' : 'after_products',
    instagram_url: (fields.instagramUrl || '').trim().slice(0, 200),
  }

  const { error } = await supabase
    .from('settings')
    .upsert(
      { id: 'site_settings', announcements: { ...announcements, video_section: videoSection } },
      { onConflict: 'id' }
    )

  if (error) return { success: false, error: error.message }

  revalidateVideoPaths()
  return { success: true }
}

export async function getAdminShoppableVideos(): Promise<{ videos: AdminShoppableVideo[]; error?: string }> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { videos: [], error: admin.error }

  const { data, error } = await admin.adminClient
    .from('shoppable_videos')
    .select('*, product:product_id ( id, name, featured_image_url, price )')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return { videos: [], error: friendlyError(error) }

  return {
    videos: (data || []).map((row: any) => ({
      ...row,
      product: Array.isArray(row.product) ? row.product[0] || null : row.product || null,
    })),
  }
}

export async function getProductOptions(): Promise<ProductOption[]> {
  const admin = await requireAdmin()
  if (admin.ok === false) return []

  const { data } = await admin.adminClient
    .from('products')
    .select('id, name, featured_image_url, price')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (data || []) as ProductOption[]
}

export async function createShoppableVideo(input: {
  videoUrl: string | null
  posterUrl: string | null
  externalUrl: string | null
  title: string
  productId: string | null
}) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  if (!input.videoUrl && !input.externalUrl) {
    return { success: false, error: 'Provide either an uploaded video or an external link.' }
  }

  const count = await supabase.from('shoppable_videos').select('*', { count: 'exact', head: true })
  if (count.error) return { success: false, error: friendlyError(count.error) }
  if ((count.count || 0) >= MAX_SHOPPABLE_VIDEOS) {
    return { success: false, error: `Maximum ${MAX_SHOPPABLE_VIDEOS} videos allowed.` }
  }

  const { error } = await supabase.from('shoppable_videos').insert([
    {
      id: crypto.randomUUID(),
      video_url: input.videoUrl || null,
      poster_url: input.posterUrl || null,
      external_url: input.externalUrl ? input.externalUrl.trim() : null,
      title: input.title.trim() || null,
      product_id: input.productId || null,
      is_active: true,
      display_order: count.count || 0,
    },
  ])

  if (error) return { success: false, error: friendlyError(error) }

  revalidateVideoPaths()
  return { success: true }
}

export async function updateShoppableVideo(
  id: string,
  fields: { title: string; productId: string | null; externalUrl?: string | null }
) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const updateData: Record<string, any> = {
    title: fields.title.trim() || null,
    product_id: fields.productId || null,
  }
  if (fields.externalUrl !== undefined) {
    updateData.external_url = fields.externalUrl ? fields.externalUrl.trim() : null
  }

  const { error } = await admin.adminClient.from('shoppable_videos').update(updateData).eq('id', id)

  if (error) return { success: false, error: friendlyError(error) }

  revalidateVideoPaths()
  return { success: true }
}

export async function toggleShoppableVideo(id: string, isActive: boolean) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const { error } = await admin.adminClient.from('shoppable_videos').update({ is_active: isActive }).eq('id', id)
  if (error) return { success: false, error: friendlyError(error) }

  revalidateVideoPaths()
  return { success: true }
}

// Swaps display_order with the neighbouring video.
export async function moveShoppableVideo(id: string, direction: 'up' | 'down') {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { data, error } = await supabase
    .from('shoppable_videos')
    .select('id')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) return { success: false, error: friendlyError(error) }

  const ids = data.map((row: any) => row.id as string)
  const index = ids.indexOf(id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || target < 0 || target >= ids.length) return { success: true }

  ;[ids[index], ids[target]] = [ids[target], ids[index]]

  // Rewrite a clean 0..n-1 order so ties can never occur.
  for (let i = 0; i < ids.length; i++) {
    const { error: updateError } = await supabase
      .from('shoppable_videos')
      .update({ display_order: i })
      .eq('id', ids[i])
    if (updateError) return { success: false, error: friendlyError(updateError) }
  }

  revalidateVideoPaths()
  return { success: true }
}

export async function deleteShoppableVideo(id: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const { error } = await admin.adminClient.from('shoppable_videos').delete().eq('id', id)
  if (error) return { success: false, error: friendlyError(error) }

  revalidateVideoPaths()
  return { success: true }
}
