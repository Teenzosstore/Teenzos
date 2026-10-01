'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserId } from '@/lib/auth/currentUser'
import { syncOrderFromShiprocket } from '@/lib/shiprocketOrder'
import { getShiprocketTrackingUrl, type ShiprocketScanEvent } from '@/lib/shiprocket'

export type TrackedOrderItem = {
  id: string
  product_name: string
  variant_name: string | null
  quantity: number
  price_at_purchase: number
  line_total: number | null
  image_url: string | null
}

export type TrackedOrder = {
  // Only set for the order's owner (guests can't open /orders/[id]).
  id: string | null
  order_number: string
  created_at: string
  order_status: string
  payment_status: string
  payment_method: string | null
  subtotal: number
  shipping_cost: number
  total_amount: number
  shipped_at: string | null
  delivered_at: string | null
  address: {
    full_name: string | null
    phone: string | null
    address_line_1: string | null
    city: string | null
    state: string | null
    postal_code: string | null
  } | null
  order_items: TrackedOrderItem[]
  shipment: {
    awb: string | null
    courier: string | null
    trackingUrl: string | null
    status: string | null
    location: string | null
    scans: ShiprocketScanEvent[]
    live: boolean
  } | null
}

const ORDER_SELECT = `
  id, user_id, order_number, created_at, order_status, payment_status, payment_method,
  subtotal, shipping_cost, total_amount, shipped_at, delivered_at,
  courier_name, tracking_number, tracking_url, shiprocket_order_id, shiprocket_awb_code,
  profiles:user_id ( email, phone ),
  addresses:address_id ( full_name, phone, alternate_phone, address_line_1, city, state, postal_code ),
  order_items ( id, product_id, product_name, variant_name, quantity, price_at_purchase, line_total )
`

const digits = (value: string) => value.replace(/\D/g, '')
// Compare phones on the last 10 digits so "+91 98765 43210" matches "9876543210".
const phoneKey = (value: string | null | undefined) => digits(value || '').slice(-10)

async function attachImages(admin: any, items: any[]): Promise<TrackedOrderItem[]> {
  const productIds = Array.from(new Set(items.map((i) => i.product_id).filter(Boolean)))
  const imageByProduct: Record<string, string> = {}

  if (productIds.length > 0) {
    const { data: products } = await admin
      .from('products')
      .select('id, featured_image_url')
      .in('id', productIds)
    products?.forEach((p: any) => {
      if (p.featured_image_url) imageByProduct[p.id] = p.featured_image_url
    })
  }

  return items.map((item) => ({
    id: item.id,
    product_name: item.product_name,
    variant_name: item.variant_name ?? null,
    quantity: item.quantity,
    price_at_purchase: Number(item.price_at_purchase),
    line_total: item.line_total != null ? Number(item.line_total) : null,
    image_url: (item.product_id && imageByProduct[item.product_id]) || null,
  }))
}

function shapeOrder(order: any, items: TrackedOrderItem[], isOwner: boolean, shipment: TrackedOrder['shipment']): TrackedOrder {
  const address = order.addresses
  return {
    id: isOwner ? order.id : null,
    order_number: order.order_number,
    created_at: order.created_at,
    order_status: order.order_status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    subtotal: Number(order.subtotal),
    shipping_cost: Number(order.shipping_cost),
    total_amount: Number(order.total_amount),
    shipped_at: order.shipped_at,
    delivered_at: order.delivered_at,
    address: address
      ? {
          full_name: address.full_name,
          phone: address.phone,
          address_line_1: address.address_line_1,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
        }
      : null,
    order_items: items,
    shipment,
  }
}

// Looks up one order by number. The owner (logged in) gets it straight away;
// anyone else must supply the email or phone used at checkout. Verified orders
// that are on Shiprocket are synced live so the result carries real courier
// status, location and scan history.
export async function trackOrderByContactAction(
  orderNumber: string,
  emailOrPhone: string
): Promise<{ success: true; order: TrackedOrder } | { success: false; error: string }> {
  const cleanOrderNumber = (orderNumber || '').trim().toUpperCase()
  if (!cleanOrderNumber) {
    return { success: false, error: 'Please enter a valid Order Number.' }
  }

  const admin = createAdminClient()
  const userId = await getCurrentUserId()

  // eq (not ilike): order numbers are stored upper-case, and ilike would let
  // user-supplied % / _ act as wildcards.
  const { data: order } = await admin
    .from('orders')
    .select(ORDER_SELECT)
    .eq('order_number', cleanOrderNumber)
    .maybeSingle()

  if (!order) {
    return { success: false, error: 'Order not found. Please double-check your Order Number (e.g. TZ-123456-789).' }
  }

  const isOwner = Boolean(userId && userId === order.user_id)

  if (!isOwner) {
    const contact = (emailOrPhone || '').trim().toLowerCase()
    if (!contact) {
      return { success: false, error: 'Please enter the email address or phone number used during checkout.' }
    }

    const profile: any = order.profiles
    const address: any = order.addresses
    const inputPhone = phoneKey(contact)

    const emailMatches = Boolean(profile?.email) && String(profile.email).toLowerCase() === contact
    // Phone numbers must match fully (10 digits) — no partial/substring matches.
    const phoneMatches =
      inputPhone.length === 10 &&
      [profile?.phone, address?.phone, address?.alternate_phone].some((p) => phoneKey(p) === inputPhone)

    if (!emailMatches && !phoneMatches) {
      return {
        success: false,
        error: 'Order number found, but the provided email or phone number does not match checkout details.',
      }
    }
  }

  // Live courier data (best effort — never blocks the lookup).
  let shipment: TrackedOrder['shipment'] = null
  let liveOrder = order
  if (order.shiprocket_order_id || order.shiprocket_awb_code) {
    const synced = await syncOrderFromShiprocket(admin, order.id)
    if (synced.success === true) {
      const { data: fresh } = await admin.from('orders').select(ORDER_SELECT).eq('id', order.id).maybeSingle()
      if (fresh) liveOrder = fresh
      const awb = liveOrder.shiprocket_awb_code || liveOrder.tracking_number || null
      shipment = {
        awb,
        courier: liveOrder.courier_name || synced.courierName,
        trackingUrl: liveOrder.tracking_url || (awb ? getShiprocketTrackingUrl(awb) : null),
        status: synced.shiprocketStatus,
        location: synced.currentLocation,
        scans: synced.scans,
        live: true,
      }
    } else {
      console.error('Live Shiprocket sync failed during order lookup:', synced.error)
      const awb = order.shiprocket_awb_code || order.tracking_number || null
      shipment = {
        awb,
        courier: order.courier_name || null,
        trackingUrl: order.tracking_url || (awb ? getShiprocketTrackingUrl(awb) : null),
        status: null,
        location: null,
        scans: [],
        live: false,
      }
    }
  }

  const items = await attachImages(admin, liveOrder.order_items || [])
  return { success: true, order: shapeOrder(liveOrder, items, isOwner, shipment) }
}

// The logged-in customer's order history (newest first).
export async function getUserOrdersAction(): Promise<
  { success: true; orders: TrackedOrder[]; isGuest: false } | { success: false; orders: []; isGuest: boolean; error?: string }
> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, orders: [], isGuest: true }

  const admin = createAdminClient()
  const { data: orders, error } = await admin
    .from('orders')
    .select(ORDER_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !orders) {
    return { success: false, orders: [], isGuest: false, error: error?.message || 'Failed to load orders' }
  }

  const allItems = orders.flatMap((o: any) => o.order_items || [])
  const withImages = await attachImages(admin, allItems)
  const imageById = new Map(withImages.map((i) => [i.id, i]))

  const shaped = orders.map((order: any) => {
    const items = (order.order_items || []).map((i: any) => imageById.get(i.id)).filter(Boolean) as TrackedOrderItem[]
    const awb = order.shiprocket_awb_code || order.tracking_number || null
    const shipment =
      order.shiprocket_order_id || awb
        ? {
            awb,
            courier: order.courier_name || null,
            trackingUrl: order.tracking_url || (awb ? getShiprocketTrackingUrl(awb) : null),
            status: null,
            location: null,
            scans: [],
            live: false,
          }
        : null
    return shapeOrder(order, items, true, shipment)
  })

  return { success: true, orders: shaped, isGuest: false }
}
