'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitInquiry(formData: FormData) {
  const supabase = createAdminClient()

  const first_name = ((formData.get('first-name') as string) || '').trim()
  const last_name = ((formData.get('last-name') as string) || '').trim()
  const email = ((formData.get('email') as string) || '').trim()
  const message = ((formData.get('message') as string) || '').trim()
  const phone = ((formData.get('phone') as string) || '').trim()

  if (!first_name || !last_name || !email || !message) {
    return { success: false, error: 'All fields are required.' }
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please provide a valid email address.' }
  }

  const payload: Record<string, any> = {
    first_name,
    last_name,
    email,
    message,
    status: 'unread',
  }

  if (phone) {
    payload.phone = phone
  }

  let { error } = await supabase.from('contact_inquiries').insert([payload])

  // Graceful fallback if 'phone' column doesn't exist yet in Supabase schema
  if (error && error.code === 'PGRST204' && payload.phone) {
    delete payload.phone
    const retry = await supabase.from('contact_inquiries').insert([payload])
    error = retry.error
  }

  if (error) {
    console.error('Failed to submit inquiry:', error)
    return { success: false, error: 'Something went wrong. Please try again later.' }
  }

  revalidatePath('/admin/inquiries')
  return { success: true }
}

