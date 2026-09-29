'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'
import {
  AnnouncementsConfig,
  DEFAULT_ANNOUNCEMENTS_CONFIG,
  DEFAULT_COUPON_TICKER,
  DEFAULT_TICKER_ITEMS,
  CouponTickerConfig,
} from '@/lib/announcements'

export async function getAnnouncementsConfig(): Promise<AnnouncementsConfig> {
  try {
    const supabase = await createClient()

    // 1. Fetch enabled state from settings table
    const { data: settingsData } = await supabase
      .from('settings')
      .select('announcements')
      .eq('id', 'site_settings')
      .maybeSingle()

    const tickerBar = settingsData?.announcements?.ticker_bar
    const isEnabled =
      typeof tickerBar?.is_enabled === 'boolean' ? tickerBar.is_enabled : true

    // 2. Query dedicated announcements table
    const { data: tableItems, error: tableError } = await supabase
      .from('announcements')
      .select('id, text, badge, badge_theme, icon, is_active, display_order')
      .order('display_order', { ascending: true })

    // Determine coupon_item config
    let couponItem: CouponTickerConfig = tickerBar?.coupon_item || DEFAULT_COUPON_TICKER

    if (!tableError && tableItems && tableItems.length > 0) {
      const codeRow = tableItems.find((r) => r.id === 'code')
      if (codeRow && !tickerBar?.coupon_item) {
        couponItem = {
          is_enabled: codeRow.is_active ?? true,
          coupon_code: 'TEENZOS10',
          badge: codeRow.badge || 'CODE: TEENZOS10',
          badge_theme: (codeRow.badge_theme as any) || 'white',
          icon: (codeRow.icon as any) || 'tag',
          text: codeRow.text || DEFAULT_COUPON_TICKER.text,
        }
      }

      // Filter out 'code' from general items list
      const generalRows = tableItems.filter((r) => r.id !== 'code')

      return {
        is_enabled: isEnabled,
        items: generalRows.map((row) => ({
          id: row.id,
          text: row.text,
          badge: row.badge || '',
          badge_theme: row.badge_theme as any,
          icon: row.icon as any,
          is_active: row.is_active ?? true,
        })),
        coupon_item: couponItem,
      }
    }

    // 3. Fallback to settings JSON if table is not yet migrated or empty
    if (tickerBar && Array.isArray(tickerBar.items) && tickerBar.items.length > 0) {
      const generalItems = tickerBar.items.filter((item: any) => item.id !== 'code')
      return {
        is_enabled: isEnabled,
        items: generalItems,
        coupon_item: couponItem,
      }
    }

    return {
      ...DEFAULT_ANNOUNCEMENTS_CONFIG,
      coupon_item: couponItem,
    }
  } catch (err) {
    console.error('Error fetching announcements config:', err)
  }

  return DEFAULT_ANNOUNCEMENTS_CONFIG
}

// Backward-compatible getAnnouncement for existing callers
export async function getAnnouncement() {
  const config = await getAnnouncementsConfig()
  const firstActive = config.items.find((item) => item.is_active)
  return {
    message: firstActive?.text || DEFAULT_TICKER_ITEMS[0].text,
    is_active: config.is_enabled,
  }
}

export async function saveAnnouncementsConfig(config: AnnouncementsConfig) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  try {
    // 1. Save master toggle, general items & dedicated coupon_item to settings table
    const { data: settings } = await supabase
      .from('settings')
      .select('announcements')
      .eq('id', 'site_settings')
      .maybeSingle()

    const existingAnnouncements = settings?.announcements
    const announcements =
      existingAnnouncements && !Array.isArray(existingAnnouncements)
        ? existingAnnouncements
        : { items: existingAnnouncements || [] }

    await supabase.from('settings').upsert(
      {
        id: 'site_settings',
        announcements: {
          ...announcements,
          ticker_bar: {
            is_enabled: config.is_enabled,
            items: config.items,
            coupon_item: config.coupon_item,
          },
        },
      },
      { onConflict: 'id' }
    )

    // 2. Save items into dedicated announcements table
    // General items (excluding any coupon id)
    const generalItems = config.items.filter((item) => item.id !== 'code')
    const currentItemIds = generalItems.map((item) => item.id)

    // Also include 'code' in allowed IDs so it isn't deleted
    const allAllowedIds = [...currentItemIds, 'code']

    // Clean up deleted general items from table
    const formattedIds = `(${allAllowedIds.map((id) => `"${id}"`).join(',')})`
    await supabase
      .from('announcements')
      .delete()
      .not('id', 'in', formattedIds)

    // Upsert current general items
    const itemsToUpsert = generalItems.map((item, index) => ({
      id: item.id || `announcement-${index + 1}`,
      text: item.text,
      badge: item.badge || '',
      badge_theme: item.badge_theme || 'cyan',
      icon: item.icon || 'sparkles',
      is_active: item.is_active ?? true,
      display_order: index,
      updated_at: new Date().toISOString(),
    }))

    // Add dedicated coupon spotlight row as id: 'code'
    if (config.coupon_item) {
      itemsToUpsert.push({
        id: 'code',
        text: config.coupon_item.text || DEFAULT_COUPON_TICKER.text,
        badge: config.coupon_item.badge || DEFAULT_COUPON_TICKER.badge,
        badge_theme: config.coupon_item.badge_theme || 'white',
        icon: (config.coupon_item.icon as any) || 'tag',
        is_active: config.coupon_item.is_enabled ?? true,
        display_order: itemsToUpsert.length,
        updated_at: new Date().toISOString(),
      })
    }

    if (itemsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('announcements')
        .upsert(itemsToUpsert, { onConflict: 'id' })

      if (upsertError) {
        console.warn('Announcements table upsert note:', upsertError.message)
      }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (err: any) {
    console.error('Error saving announcements config:', err)
    return { success: false, error: err?.message || 'Failed to save announcements' }
  }
}

