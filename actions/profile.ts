'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  const adminSupabase = createAdminClient()

  const fullName = formData.get('full_name')?.toString()
  const phone = formData.get('phone')?.toString()

  if (!fullName) {
    return { success: false, error: 'Full Name is required' }
  }

  const { error } = await adminSupabase
    .from('profiles')
    .update({ 
      full_name: fullName,
      phone: phone || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  try {
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone: phone || null
      }
    })
  } catch (e) {
    // metadata update best effort
  }

  revalidatePath('/profile')
  revalidatePath('/account')
  
  return { success: true }
}

export async function updateCustomerBasicProfile(data: {
  fullName: string
  phone: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  const trimmedName = data.fullName.trim()
  if (!trimmedName) {
    return { success: false, error: 'Full Name is required.' }
  }

  const adminSupabase = createAdminClient()

  // 1. Update profiles table
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email || '',
      full_name: trimmedName,
      phone: data.phone?.trim() || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (profileError) {
    return { success: false, error: 'Failed to update profile: ' + profileError.message }
  }

  // 2. Update auth user metadata
  try {
    await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        phone: data.phone?.trim() || null
      }
    })
  } catch (e) {
    // Ignore if auth metadata update fails
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function updateCustomerFullProfile(data: {
  fullName: string
  phone: string
  alternatePhone?: string
  street: string
  city: string
  state: string
  zipCode: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }
  const adminSupabase = createAdminClient()

  // 1. Update profiles table
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email || '',
      full_name: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (profileError) {
    return { success: false, error: 'Failed to update profile: ' + profileError.message }
  }

  // Also sync user metadata
  try {
    await supabase.auth.updateUser({
      data: {
        full_name: data.fullName.trim(),
        phone: data.phone?.trim() || null
      }
    })
  } catch (e) {
    // Ignore metadata sync error
  }

  // 2. Create or update default address
  const { data: existingAddress } = await adminSupabase
    .from('addresses')
    .select('id')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingAddress) {
    const { error: addressError } = await adminSupabase
      .from('addresses')
      .update({
        full_name: data.fullName.trim(),
        phone: data.phone.trim(),
        alternate_phone: data.alternatePhone?.trim() || null,
        address_line_1: data.street.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        postal_code: data.zipCode.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingAddress.id)

    if (addressError) {
      return { success: false, error: 'Failed to update address: ' + addressError.message }
    }
  } else if (data.street && data.city) {
    const { error: addressError } = await adminSupabase
      .from('addresses')
      .insert({
        user_id: user.id,
        full_name: data.fullName.trim(),
        phone: data.phone.trim(),
        alternate_phone: data.alternatePhone?.trim() || null,
        address_line_1: data.street.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        postal_code: data.zipCode.trim(),
        country: 'India',
        is_default: true
      })

    if (addressError) {
      return { success: false, error: 'Failed to save address: ' + addressError.message }
    }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function updateCustomerPassword(password: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateCustomerAvatar(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  const adminSupabase = createAdminClient()

  // 1. Direct update in Supabase profiles table
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('Failed to update avatar in profiles table:', profileError)
  }

  // 2. Direct update in Supabase Auth user metadata
  try {
    await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl }
    })
  } catch (e) {
    console.error('Failed to update avatar in auth metadata:', e)
  }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function saveCustomerAddress(address: {
  id?: string
  fullName: string
  phone: string
  alternatePhone?: string
  street: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  isDefault?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  if (!address.fullName?.trim() || !address.phone?.trim() || !address.street?.trim() || !address.city?.trim() || !address.zipCode?.trim()) {
    return { success: false, error: 'Please fill in all required address fields.' }
  }

  const adminSupabase = createAdminClient()

  if (address.isDefault) {
    await adminSupabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  if (address.id) {
    const { error } = await adminSupabase
      .from('addresses')
      .update({
        full_name: address.fullName.trim(),
        phone: address.phone.trim(),
        alternate_phone: address.alternatePhone?.trim() || null,
        address_line_1: address.street.trim(),
        address_line_2: address.addressLine2?.trim() || null,
        city: address.city.trim(),
        state: address.state.trim(),
        postal_code: address.zipCode.trim(),
        is_default: !!address.isDefault,
        updated_at: new Date().toISOString()
      })
      .eq('id', address.id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
  } else {
    let finalIsDefault = address.isDefault
    if (finalIsDefault === undefined) {
      const { count } = await adminSupabase
        .from('addresses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      finalIsDefault = count === 0
    }

    const { error } = await adminSupabase
      .from('addresses')
      .insert({
        user_id: user.id,
        full_name: address.fullName.trim(),
        phone: address.phone.trim(),
        alternate_phone: address.alternatePhone?.trim() || null,
        address_line_1: address.street.trim(),
        address_line_2: address.addressLine2?.trim() || null,
        city: address.city.trim(),
        state: address.state.trim(),
        postal_code: address.zipCode.trim(),
        country: 'India',
        is_default: !!finalIsDefault
      })

    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

// Helper validation function
function isZipCodeValid(zip: string | undefined): boolean {
  return Boolean(zip && zip.trim().length >= 4)
}
// Attach to address checker
(saveCustomerAddress as any).postal_code_check = isZipCodeValid

export async function deleteCustomerAddress(addressId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/profile')
  return { success: true }
}

export async function setDefaultCustomerAddress(addressId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  const adminSupabase = createAdminClient()
  await adminSupabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', user.id)

  const { error } = await adminSupabase
    .from('addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', addressId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/profile')
  return { success: true }
}

export async function trackOrderAction(orderNumberOrId: string) {
  const trimmed = orderNumberOrId.trim()
  if (!trimmed) {
    return { success: false, error: 'Order number is required.' }
  }

  const adminSupabase = createAdminClient()

  // 1. Try search by order_number (case-insensitive substring/match)
  let { data: orders, error } = await adminSupabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        price_at_purchase,
        quantity,
        line_total
      )
    `)
    .ilike('order_number', `%${trimmed}%`)
    .limit(1)

  // 2. Try by tracking_number if not found
  if (!orders || orders.length === 0) {
    const { data: altOrders } = await adminSupabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          variant_id,
          product_name,
          variant_name,
          price_at_purchase,
          quantity,
          line_total
        )
      `)
      .ilike('tracking_number', `%${trimmed}%`)
      .limit(1)

    if (altOrders && altOrders.length > 0) {
      orders = altOrders
    }
  }

  if (!orders || orders.length === 0) {
    return {
      success: false,
      error: `No live order found with number "${trimmed}". Please check the order number or view your Recent Orders.`
    }
  }

  return { success: true, order: orders[0] }
}

export async function getLiveCustomerData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminSupabase = createAdminClient()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: addresses } = await adminSupabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: orders } = await adminSupabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        price_at_purchase,
        quantity,
        line_total
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    },
    profile,
    addresses: addresses || [],
    orders: orders || []
  }
}
