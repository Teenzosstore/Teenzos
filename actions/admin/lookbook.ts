'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/adminAuth'

const LOOKBOOK_TABLE_MIGRATION_ERROR =
  'Supabase is missing the lookbook_images table. Run the Lookbook SQL migration in Supabase, then try again.'

function revalidateLookbookPaths() {
  revalidatePath('/')
  revalidatePath('/admin/lookbook')
}

function isMissingLookbookTableError(error: any) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()

  return (
    message.includes('lookbook_images') &&
    (message.includes('schema cache') || message.includes('could not find the table'))
  )
}

function lookbookActionError(error: any) {
  return isMissingLookbookTableError(error)
    ? LOOKBOOK_TABLE_MIGRATION_ERROR
    : error?.message || 'Something went wrong while updating the Lookbook.'
}

export async function getLookbookImages() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lookbook_images')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return []

    return data || []
  } catch (e) {
    console.error('getLookbookImages error:', e)
    return []
  }
}

export async function createLookbookImage(imageUrl: string, linkUrl: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const countResult = await supabase
    .from('lookbook_images')
    .select('*', { count: 'exact', head: true })

  if (countResult.error) {
    return { success: false, error: lookbookActionError(countResult.error) }
  }

  if (countResult.count && countResult.count >= 12) {
    return { success: false, error: 'Maximum 12 lookbook images allowed.' }
  }

  const { error } = await supabase
    .from('lookbook_images')
    .insert([{
      id: crypto.randomUUID(),
      image_url: imageUrl,
      link_url: linkUrl ? linkUrl.trim() : null,
      is_active: true,
      display_order: countResult.count || 0,
    }])

  if (error) return { success: false, error: lookbookActionError(error) }

  revalidateLookbookPaths()
  return { success: true }
}

export async function updateLookbookImageLink(id: string, linkUrl: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('lookbook_images')
    .update({ link_url: linkUrl ? linkUrl.trim() : null })
    .eq('id', id)

  if (error) return { success: false, error: lookbookActionError(error) }

  revalidateLookbookPaths()
  return { success: true }
}

export async function toggleLookbookImageStatus(id: string, isActive: boolean) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('lookbook_images')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { success: false, error: lookbookActionError(error) }

  revalidateLookbookPaths()
  return { success: true }
}

export async function deleteLookbookImage(id: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('lookbook_images')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: lookbookActionError(error) }

  revalidateLookbookPaths()
  return { success: true }
}
