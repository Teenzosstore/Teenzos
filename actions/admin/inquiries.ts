'use server'

import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

export async function getInquiries() {
  const admin = await requireAdmin()
  if (admin.ok === false) return []

  const { data } = await admin.adminClient
    .from('contact_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  return data || []
}

export async function markInquiryAsRead(id: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const { error } = await admin.adminClient
    .from('contact_inquiries')
    .update({ status: 'read' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/inquiries')
  return { success: true }
}

export async function deleteInquiry(id: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const { error } = await admin.adminClient
    .from('contact_inquiries')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/inquiries')
  return { success: true }
}
