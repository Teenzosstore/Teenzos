'use server'

import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'
import { sendNewsletterCampaignEmail } from '@/lib/email'

export type Subscriber = {
  id: string
  email: string
  created_at: string
}

export type CampaignPayload = {
  subject: string
  headline: string
  bodyText: string
  badgeText?: string
  ctaText?: string
  ctaUrl?: string
  offerCode?: string
}

export async function getSubscribers(): Promise<{
  success: boolean
  subscribers: Subscriber[]
  total: number
  error?: string
}> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) {
      return { success: false, subscribers: [], total: 0, error: 'Unauthorized' }
    }

    const supabase = admin.adminClient

    const { data, error, count } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getSubscribers error:', error)
      return { success: false, subscribers: [], total: 0, error: error.message }
    }

    return {
      success: true,
      subscribers: (data || []) as Subscriber[],
      total: count || (data?.length || 0),
    }
  } catch (err: any) {
    console.error('getSubscribers exception:', err)
    return { success: false, subscribers: [], total: 0, error: err?.message || 'Failed to fetch subscribers' }
  }
}

export async function deleteSubscriber(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) return { success: false, error: 'Unauthorized' }

    const supabase = admin.adminClient

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/subscribers')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete subscriber' }
  }
}

export async function sendCampaignToSubscribers(payload: CampaignPayload): Promise<{
  success: boolean
  sentCount: number
  failedCount: number
  error?: string
}> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) {
      return { success: false, sentCount: 0, failedCount: 0, error: 'Unauthorized' }
    }

    if (!payload.subject?.trim() || !payload.headline?.trim() || !payload.bodyText?.trim()) {
      return {
        success: false,
        sentCount: 0,
        failedCount: 0,
        error: 'Subject, headline, and message body are required.',
      }
    }

    const supabase = admin.adminClient

    // Fetch all active subscriber emails
    const { data: subscribers, error } = await supabase
      .from('newsletter_subscriptions')
      .select('email')

    if (error) {
      return { success: false, sentCount: 0, failedCount: 0, error: error.message }
    }

    if (!subscribers || subscribers.length === 0) {
      return { success: false, sentCount: 0, failedCount: 0, error: 'No subscribers found.' }
    }

    let sentCount = 0
    let failedCount = 0

    // Send in concurrent batches of 5 to avoid rate-limiting Brevo while keeping it fast
    const emails = subscribers.map((s) => s.email).filter(Boolean)
    const BATCH_SIZE = 5

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (email) => {
          try {
            await sendNewsletterCampaignEmail({
              toEmail: email,
              subject: payload.subject.trim(),
              headline: payload.headline.trim(),
              bodyText: payload.bodyText.trim(),
              badgeText: payload.badgeText?.trim() || 'NEW DROP ALERT',
              ctaText: payload.ctaText?.trim() || 'SHOP NOW',
              ctaUrl: payload.ctaUrl?.trim() || 'https://teenzosstore.com/shop',
              offerCode: payload.offerCode?.trim() || undefined,
            })
            sentCount++
          } catch (sendErr) {
            console.error(`Failed to send campaign email to ${email}:`, sendErr)
            failedCount++
          }
        })
      )
    }

    return {
      success: true,
      sentCount,
      failedCount,
    }
  } catch (err: any) {
    console.error('sendCampaignToSubscribers error:', err)
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      error: err?.message || 'Failed to dispatch email campaign',
    }
  }
}
