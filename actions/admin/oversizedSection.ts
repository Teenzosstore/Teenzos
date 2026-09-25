'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

export type OversizedSectionSettings = {
  background_image_url: string
  headline_top: string
  headline_accent: string
  subtitle: string
  button_text: string
  button_link: string
}

const DEFAULT_OVERSIZED_SECTION: OversizedSectionSettings = {
  background_image_url: '/OVERSIZED..png',
  headline_top: 'OVERSIZED.',
  headline_accent: 'ALWAYS.',
  subtitle: 'Relaxed fit. Maximum impact.',
  button_text: 'SHOP OVERSIZED',
  button_link: '/shop?category=oversized-tees',
}

function settingsFromRow(settings: any): OversizedSectionSettings {
  const source = settings?.announcements?.oversized_section || {}

  return {
    background_image_url: source.background_image_url || DEFAULT_OVERSIZED_SECTION.background_image_url,
    headline_top: source.headline_top || DEFAULT_OVERSIZED_SECTION.headline_top,
    headline_accent: source.headline_accent || DEFAULT_OVERSIZED_SECTION.headline_accent,
    subtitle: source.subtitle || DEFAULT_OVERSIZED_SECTION.subtitle,
    button_text: source.button_text || DEFAULT_OVERSIZED_SECTION.button_text,
    button_link: source.button_link || DEFAULT_OVERSIZED_SECTION.button_link,
  }
}

export async function getOversizedSectionSettings(): Promise<OversizedSectionSettings> {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('settings')
      .select('announcements')
      .eq('id', 'site_settings')
      .maybeSingle()

    return settingsFromRow(data)
  } catch (e) {
    console.error('getOversizedSectionSettings error:', e)
    return settingsFromRow(null)
  }
}

export async function updateOversizedSectionSettings(fields: OversizedSectionSettings) {
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

  const oversizedSection = {
    background_image_url: fields.background_image_url.trim() || DEFAULT_OVERSIZED_SECTION.background_image_url,
    headline_top: fields.headline_top.trim() || DEFAULT_OVERSIZED_SECTION.headline_top,
    headline_accent: fields.headline_accent.trim() || DEFAULT_OVERSIZED_SECTION.headline_accent,
    subtitle: fields.subtitle.trim() || DEFAULT_OVERSIZED_SECTION.subtitle,
    button_text: fields.button_text.trim() || DEFAULT_OVERSIZED_SECTION.button_text,
    button_link: fields.button_link.trim() || DEFAULT_OVERSIZED_SECTION.button_link,
  }

  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        id: 'site_settings',
        announcements: {
          ...announcements,
          oversized_section: oversizedSection,
        },
      },
      { onConflict: 'id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/oversized-section')
  return { success: true }
}
