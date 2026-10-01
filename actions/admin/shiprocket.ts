'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/adminAuth'
import {
  assignShiprocketAwbForOrder,
  createShiprocketShipmentForOrder,
  scheduleShiprocketPickupForOrderWithClient,
  syncOrderFromShiprocket,
  type ShiprocketSyncResult,
} from '@/lib/shiprocketOrder'
import type { ShiprocketParcel } from '@/lib/shiprocket'

type ActionResult = {
  success: boolean
  error?: string
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/profile')
}

export async function createShiprocketShipment(
  orderId: string,
  parcelInput?: Partial<ShiprocketParcel>
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const result = await createShiprocketShipmentForOrder(admin.adminClient, orderId, parcelInput)
  if (result.success) {
    revalidateOrderPaths(orderId)
  }

  return result
}

export async function assignShiprocketAwbToOrder(
  orderId: string,
  courierIdInput?: string
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const result = await assignShiprocketAwbForOrder(admin.adminClient, orderId, courierIdInput)
  if (result.success) {
    revalidateOrderPaths(orderId)
  }

  return result
}

export async function scheduleShiprocketPickupForOrder(orderId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const result = await scheduleShiprocketPickupForOrderWithClient(admin.adminClient, orderId)
  if (result.success) {
    revalidateOrderPaths(orderId)
  }

  return result
}

export async function syncShiprocketStatus(orderId: string): Promise<ShiprocketSyncResult> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const result = await syncOrderFromShiprocket(admin.adminClient, orderId)
  if (result.success) {
    revalidateOrderPaths(orderId)
  }

  return result
}

// Syncs every in-flight shipment (pushed to Shiprocket, not yet delivered/cancelled).
// Capped so a single click can't run past the serverless time limit.
export async function syncAllShiprocketOrders(): Promise<
  { success: true; synced: number; failed: number; remaining: number } | { success: false; error: string }
> {
  const admin = await requireAdmin()
  if (admin.ok === false) return { success: false, error: admin.error }

  const LIMIT = 40
  const { data: orders, error } = await admin.adminClient
    .from('orders')
    .select('id')
    .or('shiprocket_awb_code.not.is.null,shiprocket_order_id.not.is.null')
    .not('order_status', 'in', '(delivered,cancelled)')
    .order('created_at', { ascending: false })
    .limit(LIMIT + 1)

  if (error) return { success: false, error: error.message }

  const batch = (orders || []).slice(0, LIMIT)
  let synced = 0
  let failed = 0
  for (const order of batch) {
    const result = await syncOrderFromShiprocket(admin.adminClient, order.id)
    if (result.success) synced++
    else failed++
  }

  revalidatePath('/admin/orders')
  revalidatePath('/profile')
  return { success: true, synced, failed, remaining: Math.max(0, (orders || []).length - LIMIT) }
}
