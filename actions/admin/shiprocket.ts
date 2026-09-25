'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/adminAuth'
import {
  assignShiprocketAwbForOrder,
  createShiprocketShipmentForOrder,
  scheduleShiprocketPickupForOrderWithClient,
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
