'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

function revalidateHomeBannerPaths() {
  revalidatePath('/')
  revalidatePath('/admin/home-banner')
}

export async function getHomeBannerEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('settings')
      .select('home_banner_enabled')
      .eq('id', 'site_settings')
      .maybeSingle()

    return !!data?.home_banner_enabled
  } catch (e) {
    console.error('getHomeBannerEnabled error:', e)
    return false
  }
}

export async function setHomeBannerEnabled(enabled: boolean) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('settings')
    .upsert(
      { id: 'site_settings', home_banner_enabled: enabled },
      { onConflict: 'id' }
    )

  if (error) return { success: false, error: error.message }

  revalidateHomeBannerPaths()
  return { success: true }
}

export async function getHomeBannerImages() {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('home_banner_images')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    return data || []
  } catch (e) {
    console.error('getHomeBannerImages error:', e)
    return []
  }
}

export async function createHomeBannerImage(imageUrl: string, linkUrl: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { count } = await supabase
    .from('home_banner_images')
    .select('*', { count: 'exact', head: true })

  if (count && count >= 8) {
    return { success: false, error: 'Maximum 8 banner images allowed.' }
  }

  const { error } = await supabase
    .from('home_banner_images')
    .insert([{
      id: crypto.randomUUID(),
      image_url: imageUrl,
      link_url: linkUrl ? linkUrl.trim() : null,
      is_active: true,
      display_order: count || 0,
    }])

  if (error) return { success: false, error: error.message }

  revalidateHomeBannerPaths()
  return { success: true }
}

export async function updateHomeBannerImageLink(id: string, linkUrl: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('home_banner_images')
    .update({ link_url: linkUrl ? linkUrl.trim() : null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidateHomeBannerPaths()
  return { success: true }
}

export async function toggleHomeBannerImageStatus(id: string, isActive: boolean) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('home_banner_images')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidateHomeBannerPaths()
  return { success: true }
}

export async function deleteHomeBannerImage(id: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('home_banner_images')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidateHomeBannerPaths()
  return { success: true }
}
