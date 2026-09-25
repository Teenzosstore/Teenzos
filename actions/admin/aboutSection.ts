'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import {
  DEFAULT_ABOUT_SECTION,
  type AboutSectionSettings,
} from '@/lib/aboutSection'

function settingsFromRow(settings: any): AboutSectionSettings {
  const source = settings?.announcements?.about_section || {}

  return {
    image_url: source.image_url || DEFAULT_ABOUT_SECTION.image_url,
    eyebrow: source.eyebrow || DEFAULT_ABOUT_SECTION.eyebrow,
    headline_top: source.headline_top || DEFAULT_ABOUT_SECTION.headline_top,
    headline_bottom: source.headline_bottom || DEFAULT_ABOUT_SECTION.headline_bottom,
    paragraph_one: source.paragraph_one || DEFAULT_ABOUT_SECTION.paragraph_one,
    paragraph_two: source.paragraph_two || DEFAULT_ABOUT_SECTION.paragraph_two,
    badge_value: source.badge_value || DEFAULT_ABOUT_SECTION.badge_value,
    badge_label: source.badge_label || DEFAULT_ABOUT_SECTION.badge_label,
    stat_one_value: source.stat_one_value || DEFAULT_ABOUT_SECTION.stat_one_value,
    stat_one_label: source.stat_one_label || DEFAULT_ABOUT_SECTION.stat_one_label,
    stat_two_value: source.stat_two_value || DEFAULT_ABOUT_SECTION.stat_two_value,
    stat_two_label: source.stat_two_label || DEFAULT_ABOUT_SECTION.stat_two_label,
    stat_three_value: source.stat_three_value || DEFAULT_ABOUT_SECTION.stat_three_value,
    stat_three_label: source.stat_three_label || DEFAULT_ABOUT_SECTION.stat_three_label,
  }
}

export async function getAboutSectionSettings(): Promise<AboutSectionSettings> {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('settings')
      .select('announcements')
      .eq('id', 'site_settings')
      .maybeSingle()

    return settingsFromRow(data)
  } catch (e) {
    console.error('getAboutSectionSettings error:', e)
    return settingsFromRow(null)
  }
}

export async function updateAboutSectionSettings(fields: AboutSectionSettings) {
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

  const aboutSection = {
    image_url: fields.image_url.trim() || DEFAULT_ABOUT_SECTION.image_url,
    eyebrow: fields.eyebrow.trim() || DEFAULT_ABOUT_SECTION.eyebrow,
    headline_top: fields.headline_top.trim() || DEFAULT_ABOUT_SECTION.headline_top,
    headline_bottom: fields.headline_bottom.trim() || DEFAULT_ABOUT_SECTION.headline_bottom,
    paragraph_one: fields.paragraph_one.trim() || DEFAULT_ABOUT_SECTION.paragraph_one,
    paragraph_two: fields.paragraph_two.trim() || DEFAULT_ABOUT_SECTION.paragraph_two,
    badge_value: fields.badge_value.trim() || DEFAULT_ABOUT_SECTION.badge_value,
    badge_label: fields.badge_label.trim() || DEFAULT_ABOUT_SECTION.badge_label,
    stat_one_value: fields.stat_one_value.trim() || DEFAULT_ABOUT_SECTION.stat_one_value,
    stat_one_label: fields.stat_one_label.trim() || DEFAULT_ABOUT_SECTION.stat_one_label,
    stat_two_value: fields.stat_two_value.trim() || DEFAULT_ABOUT_SECTION.stat_two_value,
    stat_two_label: fields.stat_two_label.trim() || DEFAULT_ABOUT_SECTION.stat_two_label,
    stat_three_value: fields.stat_three_value.trim() || DEFAULT_ABOUT_SECTION.stat_three_value,
    stat_three_label: fields.stat_three_label.trim() || DEFAULT_ABOUT_SECTION.stat_three_label,
  }

  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        id: 'site_settings',
        announcements: {
          ...announcements,
          about_section: aboutSection,
        },
      },
      { onConflict: 'id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/about')
  revalidatePath('/admin/about-section')
  return { success: true }
}
