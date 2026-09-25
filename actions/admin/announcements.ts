'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

type Announcement = {
  message: string
  is_active: boolean
}

const DEFAULT_ANNOUNCEMENT: Announcement = {
  message: 'Free Shipping on Orders Above Rs. 1,099',
  is_active: true,
}

function parseAnnouncement(settings: any): Announcement {
  const source = settings?.announcements?.global_announcement || {}

  return {
    message: source.message || DEFAULT_ANNOUNCEMENT.message,
    is_active: typeof source.is_active === 'boolean' ? source.is_active : DEFAULT_ANNOUNCEMENT.is_active,
  }
}

export async function getAnnouncement() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('settings')
    .select('announcements')
    .eq('id', 'site_settings')
    .single()

  return parseAnnouncement(data)
}

export async function saveAnnouncement(message: string, isActive: boolean) {
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

  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        id: 'site_settings',
        announcements: {
          ...announcements,
          global_announcement: {
            message: message.trim(),
            is_active: isActive,
          },
        },
      },
      { onConflict: 'id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/announcements')
  return { success: true }
}
