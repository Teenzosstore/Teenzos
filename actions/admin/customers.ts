'use server'

import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

export type AdminActionResult = {
  error?: string
  success?: boolean
}

export async function getCustomers() {
  const admin = await requireAdmin()
  if (admin.ok === false) return []

  // Fetch customers
  const { data: customers } = await admin.adminClient
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  return customers || []
}

export async function toggleCustomerStatus(
  id: string,
  isActive: boolean
): Promise<AdminActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { error: admin.error }

  const { error } = await admin.adminClient
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('role', 'customer')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/customers')
  return { success: true }
}
