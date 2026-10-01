import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay'
import { processRazorpayPayment } from '@/lib/razorpayFulfillment'

// Razorpay Dashboard -> Account & Settings -> Webhooks -> Add New Webhook:
//   URL:    https://<your-domain>/api/webhooks/razorpay
//   Secret: any string you choose — set the same value as RAZORPAY_WEBHOOK_SECRET
//   Events: payment.captured, order.paid, payment.failed, refund.processed
//
// This is the reliability backstop for the browser-side verify in
// actions/checkout.ts (verifyRazorpayPayment): it fires even if the customer
// closes the tab right after paying, or a UPI payment confirms late.
//
// Every delivery is authenticated with HMAC-SHA256(raw body, webhook secret)
// from the x-razorpay-signature header. Unknown/irrelevant events and unknown
// orders are acknowledged with 200 so Razorpay doesn't keep retrying them;
// real failures return 500 so Razorpay retries.
export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error('[Razorpay Webhook Error]: RAZORPAY_WEBHOOK_SECRET is not configured.')
    return NextResponse.json({ success: false, error: 'Webhook not configured' }, { status: 500 })
  }
  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    console.error('[Razorpay Webhook Error]: Invalid or missing x-razorpay-signature.')
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const type: string = event?.event
  const payment = event?.payload?.payment?.entity
  const orderEntity = event?.payload?.order?.entity

  try {
    switch (type) {
      case 'payment.captured':
      case 'order.paid': {
        // order.paid carries both entities; payment.captured only the payment.
        const razorpayOrderId: string | undefined = payment?.order_id || orderEntity?.id
        const razorpayPaymentId: string | undefined = payment?.id
        const amountPaise: number | undefined = payment?.amount

        if (!razorpayOrderId || !razorpayPaymentId) {
          console.warn('[Razorpay Webhook]: Missing order/payment id in', type)
          break
        }

        const result = await processRazorpayPayment({ razorpayOrderId, razorpayPaymentId, amountPaise })
        if (result.ok === false) {
          console.error('[Razorpay Webhook Error]:', type, result.reason, razorpayOrderId)
        }
        break
      }

      case 'payment.failed': {
        // Deliberately NOT marking the order failed: Razorpay Checkout lets the
        // customer retry on the same Razorpay order, and a later success would
        // arrive as payment.captured. Just record it for visibility.
        console.warn(
          '[Razorpay Webhook]: payment.failed',
          payment?.order_id,
          payment?.error_description || payment?.error_code || ''
        )
        break
      }

      case 'refund.processed': {
        const refund = event?.payload?.refund?.entity
        const paymentId: string | undefined = refund?.payment_id
        if (!paymentId) break

        const admin = createAdminClient()
        const { data: order } = await admin
          .from('orders')
          .select('id, total_amount, payment_status')
          .eq('razorpay_payment_id', paymentId)
          .maybeSingle()

        // Only a full refund flips the order to "refunded"; partial refunds
        // are left for the admin to handle manually.
        if (order && order.payment_status === 'paid' && Number(refund.amount) >= Math.round(Number(order.total_amount) * 100)) {
          await admin
            .from('orders')
            .update({ payment_status: 'refunded', updated_at: new Date().toISOString() })
            .eq('id', order.id)
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ success: true, event: type })
  } catch (error: any) {
    console.error('[Razorpay Webhook Critical Error]:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Internal error' }, { status: 500 })
  }
}
