'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1
  return Math.max(1, Math.min(99, Math.floor(quantity)))
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function addToCart(variantId: string, quantity: number = 1) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Please log in to add items to your cart.', requiresLogin: true }
  }
  const adminSupabase = createAdminClient()
  const requestedQuantity = normalizeQuantity(quantity)

  const { data: variant, error: variantError } = await adminSupabase
    .from('product_variants')
    .select('id, stock_quantity, is_active, products ( is_active )')
    .eq('id', variantId)
    .single()

  const product = firstRelation(variant?.products)

  if (variantError || !variant || !variant.is_active || product?.is_active === false) {
    return { success: false, error: 'This product variant is no longer available.' }
  }

  // Check if this variant already exists in the user's cart
  const { data: existing } = await adminSupabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('variant_id', variantId)
    .single()

  if (existing) {
    // Update quantity
    const newQty = normalizeQuantity(existing.quantity + requestedQuantity)
    if (Number(variant.stock_quantity) < newQty) {
      return { success: false, error: 'Not enough stock available for this variant.' }
    }

    const { error } = await adminSupabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existing.id)

    if (error) return { success: false, error: error.message }
  } else {
    if (Number(variant.stock_quantity) < requestedQuantity) {
      return { success: false, error: 'Not enough stock available for this variant.' }
    }

    // Insert new
    const { error } = await adminSupabase
      .from('cart_items')
      .insert([{ user_id: user.id, variant_id: variantId, quantity: requestedQuantity }])

    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/cart')
  return { success: true }
}

export async function removeFromCart(cartItemId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/cart')
  return { success: true }
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const adminSupabase = createAdminClient()

  const nextQuantity = normalizeQuantity(quantity)

  if (quantity <= 0) {
    return removeFromCart(cartItemId)
  }

  const { data: item } = await adminSupabase
    .from('cart_items')
    .select('variant_id, product_variants ( stock_quantity, is_active, products ( is_active ) )')
    .eq('id', cartItemId)
    .eq('user_id', user.id)
    .single()

  const variant = firstRelation(item?.product_variants)
  const product = firstRelation(variant?.products)

  if (!item || !variant?.is_active || product?.is_active === false) {
    return { success: false, error: 'This product variant is no longer available.' }
  }

  if (Number(variant.stock_quantity) < nextQuantity) {
    return { success: false, error: 'Not enough stock available for this variant.' }
  }

  const { error } = await adminSupabase
    .from('cart_items')
    .update({ quantity: nextQuantity })
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/cart')
  return { success: true }
}

export async function getCart() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not logged in', items: [] }
  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      variant_id,
      product_variants (
        id,
        variant_name,
        price,
        original_price,
        stock_quantity,
        is_active,
        product_id,
        products (
          id,
          name,
          slug,
          featured_image_url,
          categories ( name ),
          product_images ( image_url )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message, items: [] }

  return { success: true, items: data || [] }
}

export async function getCartCount() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const adminSupabase = createAdminClient()

  const { data } = await adminSupabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', user.id)

  if (!data) return 0

  return data.reduce((sum, item) => sum + item.quantity, 0)
}

export async function clearCart() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/cart')
  revalidatePath('/checkout')
  return { success: true }
}
