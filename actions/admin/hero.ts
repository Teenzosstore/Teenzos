'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

type HeroPosition = 'left' | 'right'

export type HeroLeftText = {
  eyebrow: string
  headline_top: string
  headline_accent: string
  subtitle: string
  button_text: string
  button_link: string
}

const DEFAULT_HERO_LEFT_TEXT: HeroLeftText = {
  eyebrow: "NEW SEASON '24",
  headline_top: 'MADE FOR',
  headline_accent: 'THE STREETS',
  subtitle: 'Oversized silhouettes. Premium fabrics.\nDesigned to move with you.',
  button_text: 'SHOP NOW',
  button_link: '/shop',
}

function isMissingPositionColumnError(error: any) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()

  return (
    error?.code === 'PGRST204' &&
    message.includes('position') &&
    message.includes('hero_slides')
  )
}

export async function getHeroSlides() {
  try {
    const supabase = await createClient()
    
    const { data } = await supabase
      .from('hero_slides')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    return data || []
  } catch (e) {
    console.error('getHeroSlides error:', e)
    return []
  }
}

function parseHeroLeftText(settings: any): HeroLeftText {
  const source = settings?.announcements?.hero_left_text || {}

  return {
    eyebrow: source.eyebrow || DEFAULT_HERO_LEFT_TEXT.eyebrow,
    headline_top: source.headline_top || DEFAULT_HERO_LEFT_TEXT.headline_top,
    headline_accent: source.headline_accent || DEFAULT_HERO_LEFT_TEXT.headline_accent,
    subtitle: source.subtitle || DEFAULT_HERO_LEFT_TEXT.subtitle,
    button_text: source.button_text || DEFAULT_HERO_LEFT_TEXT.button_text,
    button_link: source.button_link || DEFAULT_HERO_LEFT_TEXT.button_link,
  }
}

export async function getHeroLeftText(): Promise<HeroLeftText> {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('settings')
      .select('announcements')
      .eq('id', 'site_settings')
      .maybeSingle()

    return parseHeroLeftText(data)
  } catch (e) {
    console.error('getHeroLeftText error:', e)
    return parseHeroLeftText(null)
  }
}

export async function updateHeroLeftText(fields: HeroLeftText) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { data: settings } = await supabase
    .from('settings')
    .select('announcements')
    .eq('id', 'site_settings')
    .single()

  const existingAnnouncements = settings?.announcements
  const announcements =
    existingAnnouncements && !Array.isArray(existingAnnouncements)
      ? existingAnnouncements
      : { items: existingAnnouncements || [] }

  const heroLeftText = {
    eyebrow: fields.eyebrow.trim() || DEFAULT_HERO_LEFT_TEXT.eyebrow,
    headline_top: fields.headline_top.trim() || DEFAULT_HERO_LEFT_TEXT.headline_top,
    headline_accent: fields.headline_accent.trim() || DEFAULT_HERO_LEFT_TEXT.headline_accent,
    subtitle: fields.subtitle.trim() || DEFAULT_HERO_LEFT_TEXT.subtitle,
    button_text: fields.button_text.trim() || DEFAULT_HERO_LEFT_TEXT.button_text,
    button_link: fields.button_link.trim() || DEFAULT_HERO_LEFT_TEXT.button_link,
  }

  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        id: 'site_settings',
        announcements: {
          ...announcements,
          hero_left_text: heroLeftText,
        },
      },
      { onConflict: 'id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/hero-slides')
  return { success: true }
}

async function getHeroSlideCount(supabase: any, position: HeroPosition) {
  const positionCountResult = await supabase
    .from('hero_slides')
    .select('id', { count: 'exact', head: true })
    .eq('position', position)

  if (!positionCountResult.error) {
    return {
      count: positionCountResult.count || 0,
      hasPositionColumn: true,
      error: null,
    }
  }

  if (!isMissingPositionColumnError(positionCountResult.error)) {
    return {
      count: 0,
      hasPositionColumn: true,
      error: positionCountResult.error,
    }
  }

  const totalCountResult = await supabase
    .from('hero_slides')
    .select('id', { count: 'exact', head: true })

  return {
    count: totalCountResult.count || 0,
    hasPositionColumn: false,
    error: totalCountResult.error,
  }
}

export async function createHeroSlide(imageUrl: string, position: HeroPosition = 'right') {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { count, hasPositionColumn, error: countError } = await getHeroSlideCount(supabase, position)

  if (countError) return { success: false, error: countError.message }

  if (count && count >= 5) {
    const limitScope = hasPositionColumn ? `the ${position} side` : 'hero section'
    return { success: false, error: `Maximum 5 slides allowed for ${limitScope}.` }
  }

  if (!hasPositionColumn && position === 'left') {
    return {
      success: false,
      error: 'The left hero area requires the hero_slides.position database migration. Right area slides can still be managed.',
    }
  }

  const slide = {
    id: crypto.randomUUID(),
    image_url: imageUrl,
    is_active: true,
    display_order: count || 0,
    ...(hasPositionColumn ? { position } : {}),
  }

  const { error } = await supabase
    .from('hero_slides')
    .insert([slide])

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/hero-slides')
  return { success: true }
}

export async function deleteHeroSlide(id: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('hero_slides')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/hero-slides')
  return { success: true }
}

export async function updateHeroSlide(
  id: string,
  fields: {
    title?: string
    subtitle?: string
    button_text?: string
    button_link?: string
    display_order?: number
  }
) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('hero_slides')
    .update(fields)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/hero-slides')
  return { success: true }
}

export async function toggleHeroSlideStatus(id: string, isActive: boolean) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('hero_slides')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/hero-slides')
  return { success: true }
}
