import crypto from 'crypto'

// Razorpay is called over its REST API directly (Basic auth with key id /
// secret) so no extra SDK dependency is needed.

export function isRazorpayEnabled() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID as string
}

type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  receipt: string | null
  status: string
}

export async function createRazorpayOrder(input: {
  amountPaise: number
  receipt: string
  notes?: Record<string, string>
}): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured')

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
      payment_capture: 1,
      // Razorpay echoes notes back on payment/order webhook payloads, which is
      // how the webhook can resolve our internal order even without a lookup.
      notes: input.notes || {},
    }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.error?.description || `Razorpay order creation failed (${response.status})`)
  }

  return payload as RazorpayOrder
}

// Fetches an order's own status straight from Razorpay — used to confirm
// whether money actually moved before cancelling a locally-pending order
// (see cancelPendingRazorpayOrder in actions/checkout.ts).
export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder | null> {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return null

  const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` },
  })
  if (!response.ok) return null

  const payload = await response.json().catch(() => null)
  return payload?.id ? (payload as RazorpayOrder) : null
}

function safeEqualHex(a: string, b: string) {
  const bufferA = Buffer.from(a.toLowerCase(), 'utf8')
  const bufferB = Buffer.from(b.toLowerCase(), 'utf8')
  if (bufferA.length !== bufferB.length) return false
  return crypto.timingSafeEqual(bufferA, bufferB)
}

// Checks the signature Razorpay Checkout hands back to the browser after a
// successful payment: HMAC-SHA256(order_id|payment_id) with the key secret.
export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret || !orderId || !paymentId || !signature) return false

  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex')
  return safeEqualHex(expected, signature)
}

// Checks a webhook delivery: HMAC-SHA256(raw body) with the webhook secret
// (the one you set when creating the webhook in the Razorpay dashboard).
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqualHex(expected, signature)
}
