'use server'

import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

const ORDER_STATUSES = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
const PAYMENT_STATUSES = new Set(['pending', 'paid', 'failed', 'refunded'])

function revalidateOrderPaths(orderId: string) {
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/profile')
}

export async function updateOrderStatus(orderId: string, status: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  if (!ORDER_STATUSES.has(status)) return { success: false, error: 'Invalid order status' }

  const adminClient = admin.adminClient

  const updateData: any = { order_status: status }
  
  // Set timestamps based on new status
  if (status === 'shipped') {
    updateData.shipped_at = new Date().toISOString()
    updateData.delivered_at = null
    updateData.cancelled_at = null
  }
  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
    updateData.cancelled_at = null
  }
  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  }
  if (status === 'pending' || status === 'processing') {
    updateData.shipped_at = null
    updateData.delivered_at = null
    updateData.cancelled_at = null
  }

  const { error } = await adminClient
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  revalidateOrderPaths(orderId)
  return { success: true }
}

export async function updatePaymentStatus(orderId: string, status: string) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }
  if (!PAYMENT_STATUSES.has(status)) return { success: false, error: 'Invalid payment status' }

  const adminClient = admin.adminClient

  const updateData: any = { payment_status: status }
  
  // Set timestamps based on new status
  if (status === 'paid') updateData.paid_at = new Date().toISOString()

  const { error } = await adminClient
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  revalidateOrderPaths(orderId)
  return { success: true }
}

export async function updateDeliveryTracking(
  orderId: string,
  fields: {
    courier_name?: string
    tracking_number?: string
    tracking_url?: string
    shipment_notes?: string
  }
) {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const trackingUrl = fields.tracking_url?.trim() || null
  if (trackingUrl && !trackingUrl.startsWith('https://') && !trackingUrl.startsWith('http://')) {
    return { success: false, error: 'Tracking URL must start with http:// or https://' }
  }

  const { error } = await admin.adminClient
    .from('orders')
    .update({
      courier_name: fields.courier_name?.trim() || null,
      tracking_number: fields.tracking_number?.trim() || null,
      tracking_url: trackingUrl,
      shipment_notes: fields.shipment_notes?.trim() || null,
    })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  revalidateOrderPaths(orderId)
  return { success: true }
}
