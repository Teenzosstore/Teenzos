'use server'

import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

export async function toggleUseGlobalFaqs(productId: string, useGlobalFaqs: boolean) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  const supabase = admin.adminClient

  const { error } = await supabase
    .from('products')
    .update({ use_global_faqs: useGlobalFaqs })
    .eq('id', productId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Use the RPC function or just revalidate path
  revalidatePath('/admin/products/[id]/edit', 'page')
  revalidatePath('/product/[slug]', 'page')
  
  return { success: true }
}
