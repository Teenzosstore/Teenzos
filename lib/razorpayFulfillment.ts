import { createAdminClient } from '@/lib/supabase/admin'
import { markOrderPaid } from '@/lib/orderPayment'

export type RazorpayResult =
  | { ok: true; orderNumber: string }
  | { ok: false; reason: string; razorpayOrderId?: string }

// Applies a confirmed Razorpay payment to the matching order. Callers must
// have verified authenticity first (checkout signature or webhook signature).
// Shared by the browser verify action and the webhook, so a payment is never
// applied twice regardless of which arrives first.
export async function processRazorpayPayment(input: {
  razorpayOrderId: string
  razorpayPaymentId: string
  // Amount Razorpay says was paid, in paise. When provided it must match what
  // we billed — defense in depth against a mismatched/replayed payment.
  amountPaise?: number
}): Promise<RazorpayResult> {
  const { razorpayOrderId, razorpayPaymentId, amountPaise } = input
  if (!razorpayOrderId || !razorpayPaymentId) {
    return { ok: false, reason: 'missing_ids', razorpayOrderId }
  }

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select('id, user_id, order_number, total_amount')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle()

  if (error || !order) {
    return { ok: false, reason: 'order_not_found', razorpayOrderId }
  }

  if (amountPaise !== undefined && Math.round(Number(order.total_amount) * 100) !== Number(amountPaise)) {
    console.error('[Razorpay] Amount mismatch for', order.order_number, '— got', amountPaise, 'paise, expected', Math.round(Number(order.total_amount) * 100))
    return { ok: false, reason: 'amount_mismatch', razorpayOrderId }
  }

  await markOrderPaid(admin, order, { column: 'razorpay_payment_id', id: razorpayPaymentId, tag: 'Razorpay' })
  return { ok: true, orderNumber: order.order_number }
}
