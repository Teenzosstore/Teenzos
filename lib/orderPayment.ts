import { trySendOrderConfirmationEmail } from '@/lib/orderConfirmationEmail'

// Marks an online-paid order as paid and runs fulfillment exactly once. Shared
// by both Razorpay paths (browser verify call and the webhook).
//
// The update is an atomic claim (`payment_status != 'paid'` + returning the
// row): when a redirect/verify call and a webhook race, only the first one
// gets a row back and runs the side effects below — the other is a no-op.
export async function markOrderPaid(
  admin: any,
  order: { id: string; user_id: string | null; order_number: string },
  payment: { column: 'razorpay_payment_id'; id: string | null; tag: string }
): Promise<{ firstTime: boolean }> {
  const now = new Date().toISOString()

  const { data: claimed, error: claimError } = await admin
    .from('orders')
    .update({
      payment_status: 'paid',
      order_status: 'processing',
      [payment.column]: payment.id,
      paid_at: now,
      updated_at: now,
    })
    .eq('id', order.id)
    .neq('payment_status', 'paid')
    .select('id')
    .maybeSingle()

  if (claimError) {
    console.error(`[${payment.tag}] DB update failed for successful payment:`, claimError.message)
    throw new Error(claimError.message)
  }
  if (!claimed) return { firstTime: false }

  const { error: stockError } = await admin.rpc('decrement_order_stock_once', {
    order_id_input: order.id,
  })
  if (stockError) {
    // Money is captured but stock ran out in the meantime — needs a human.
    console.error(`[${payment.tag}] Stock decrement failed after payment`, order.order_number, stockError.message)
    await admin
      .from('orders')
      .update({ shipment_notes: `PAID but stock update failed: ${stockError.message}. Review / refund.` })
      .eq('id', order.id)
  }

  if (order.user_id) {
    await admin.from('cart_items').delete().eq('user_id', order.user_id)
  }

  await trySendOrderConfirmationEmail(admin, order.id)
  return { firstTime: true }
}
