import { sendTransactionalEmail } from '@/lib/email'

type OrderItemForEmail = {
  product_name: string
  variant_name: string | null
  price_at_purchase: number | string
  quantity: number | string
  line_total: number | string
}

type OrderForEmail = {
  id: string
  order_number: string
  subtotal: number | string
  shipping_cost: number | string
  total_amount: number | string
  payment_status: string | null
  order_status: string | null
  payment_method: string | null
  created_at: string
  order_confirmation_email_sent_at?: string | null
  profiles?: {
    full_name: string | null
    email: string | null
  } | null
  addresses?: {
    full_name: string | null
    phone: string | null
    address_line_1: string | null
    address_line_2: string | null
    city: string | null
    state: string | null
    postal_code: string | null
    country: string | null
  } | null
  order_items?: OrderItemForEmail[]
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatAmount(value: number | string | null | undefined) {
  const amount = Number(value || 0)
  return `INR ${amount.toFixed(2)}`
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value))
}

function buildAddressLines(order: OrderForEmail) {
  const address = order.addresses
  if (!address) return ['Address not available']

  return [
    address.full_name,
    address.address_line_1,
    address.address_line_2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country || 'India',
    address.phone ? `Phone: ${address.phone}` : null,
  ].filter(Boolean) as string[]
}

function buildOrderItemsHtml(items: OrderItemForEmail[]) {
  return items.map((item) => {
    const quantity = Number(item.quantity || 0)
    const variantName = item.variant_name ? ` (${escapeHtml(item.variant_name)})` : ''

    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #262926;">
          <div style="color: #EAE6E2; font-size: 14px; font-weight: 700;">${escapeHtml(item.product_name)}${variantName}</div>
          <div style="color: rgba(234,230,226,0.62); font-size: 12px; margin-top: 4px;">Qty ${quantity} x ${formatAmount(item.price_at_purchase)}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #262926; color: #EAE6E2; font-size: 14px; font-weight: 700; text-align: right;">
          ${formatAmount(item.line_total)}
        </td>
      </tr>
    `
  }).join('')
}

function buildOrderConfirmationHtml(order: OrderForEmail) {
  const customerName = order.addresses?.full_name || order.profiles?.full_name || 'Customer'
  const addressLines = buildAddressLines(order)
  const orderItems = order.order_items || []

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; background: #0a0909; color: #EAE6E2; border: 1px solid #262926; border-radius: 12px;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #262926;">
        <h1 style="margin: 0; color: #EAE6E2; font-size: 28px; letter-spacing: 2px;">Teenzosstore</h1>
        <p style="margin: 10px 0 0; color: #D4A82C; font-size: 13px; font-weight: 700;">Order Confirmed</p>
      </div>

      <div style="padding: 24px 0;">
        <h2 style="margin: 0 0 10px; color: #EAE6E2; font-size: 22px;">Thanks for your order, ${escapeHtml(customerName)}.</h2>
        <p style="margin: 0; color: rgba(234,230,226,0.72); font-size: 14px; line-height: 1.6;">
          We have received your order and will start processing it soon. Your order details are below.
        </p>
      </div>

      <div style="background: #141614; border: 1px solid #262926; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: rgba(234,230,226,0.62); font-size: 13px; padding: 4px 0;">Order Number</td>
            <td style="color: #EAE6E2; font-size: 13px; font-weight: 700; text-align: right; padding: 4px 0;">${escapeHtml(order.order_number)}</td>
          </tr>
          <tr>
            <td style="color: rgba(234,230,226,0.62); font-size: 13px; padding: 4px 0;">Order Date</td>
            <td style="color: #EAE6E2; font-size: 13px; font-weight: 700; text-align: right; padding: 4px 0;">${escapeHtml(formatOrderDate(order.created_at))}</td>
          </tr>
          <tr>
            <td style="color: rgba(234,230,226,0.62); font-size: 13px; padding: 4px 0;">Payment Method</td>
            <td style="color: #EAE6E2; font-size: 13px; font-weight: 700; text-align: right; padding: 4px 0;">${escapeHtml(order.payment_method || 'Not available')}</td>
          </tr>
          <tr>
            <td style="color: rgba(234,230,226,0.62); font-size: 13px; padding: 4px 0;">Payment Status</td>
            <td style="color: #EAE6E2; font-size: 13px; font-weight: 700; text-align: right; padding: 4px 0;">${escapeHtml(order.payment_status || 'pending')}</td>
          </tr>
        </table>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="padding-bottom: 8px; border-bottom: 1px solid #D4A82C; color: #D4A82C; font-size: 12px; text-align: left; text-transform: uppercase;">Items</th>
            <th style="padding-bottom: 8px; border-bottom: 1px solid #D4A82C; color: #D4A82C; font-size: 12px; text-align: right; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${buildOrderItemsHtml(orderItems)}
        </tbody>
      </table>

      <div style="background: #141614; border: 1px solid #262926; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: rgba(234,230,226,0.68); font-size: 14px; padding: 5px 0;">Subtotal</td>
            <td style="color: #EAE6E2; font-size: 14px; text-align: right; padding: 5px 0;">${formatAmount(order.subtotal)}</td>
          </tr>
          <tr>
            <td style="color: rgba(234,230,226,0.68); font-size: 14px; padding: 5px 0;">Shipping</td>
            <td style="color: #EAE6E2; font-size: 14px; text-align: right; padding: 5px 0;">${formatAmount(order.shipping_cost)}</td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #262926; color: #D4A82C; font-size: 16px; font-weight: 800; padding: 12px 0 0;">Total</td>
            <td style="border-top: 1px solid #262926; color: #D4A82C; font-size: 16px; font-weight: 800; text-align: right; padding: 12px 0 0;">${formatAmount(order.total_amount)}</td>
          </tr>
        </table>
      </div>

      <div style="background: #141614; border: 1px solid #262926; border-radius: 10px; padding: 16px;">
        <h3 style="margin: 0 0 10px; color: #EAE6E2; font-size: 15px;">Shipping Address</h3>
        <p style="margin: 0; color: rgba(234,230,226,0.72); font-size: 13px; line-height: 1.7;">
          ${addressLines.map((line) => escapeHtml(line)).join('<br />')}
        </p>
      </div>

      <p style="margin: 24px 0 0; color: rgba(234,230,226,0.56); font-size: 12px; line-height: 1.6; text-align: center;">
        You will receive another update when your order ships.
      </p>
      <p style="margin: 18px 0 0; color: #D4A82C; font-size: 11px; text-align: center;">
        &copy; ${new Date().getFullYear()} Teenzosstore. All rights reserved.
      </p>
    </div>
  `
}

async function claimOrderConfirmationEmail(adminClient: any, orderId: string) {
  const sentAt = new Date().toISOString()
  const { data, error } = await adminClient
    .from('orders')
    .update({ order_confirmation_email_sent_at: sentAt })
    .eq('id', orderId)
    .is('order_confirmation_email_sent_at', null)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? sentAt : null
}

async function releaseOrderConfirmationEmailClaim(adminClient: any, orderId: string, sentAt: string) {
  const { error } = await adminClient
    .from('orders')
    .update({ order_confirmation_email_sent_at: null })
    .eq('id', orderId)
    .eq('order_confirmation_email_sent_at', sentAt)

  if (error) {
    throw new Error(error.message)
  }
}

async function loadOrderForConfirmationEmail(adminClient: any, orderId: string) {
  const { data, error } = await adminClient
    .from('orders')
    .select(`
      id,
      order_number,
      subtotal,
      shipping_cost,
      total_amount,
      payment_status,
      order_status,
      payment_method,
      created_at,
      order_confirmation_email_sent_at,
      profiles:user_id (
        full_name,
        email
      ),
      addresses:address_id (
        full_name,
        phone,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country
      ),
      order_items (
        product_name,
        variant_name,
        price_at_purchase,
        quantity,
        line_total
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Order not found')
  }

  return data as OrderForEmail
}

export async function sendOrderConfirmationEmailOnce(adminClient: any, orderId: string) {
  const order = await loadOrderForConfirmationEmail(adminClient, orderId)
  const email = order.profiles?.email

  if (!email) {
    throw new Error('Customer email is not available for order confirmation.')
  }

  const sentAt = await claimOrderConfirmationEmail(adminClient, orderId)
  if (!sentAt) {
    return
  }

  try {
    await sendTransactionalEmail({
      to: {
        email,
        name: order.addresses?.full_name || order.profiles?.full_name,
      },
      subject: `Teenzosstore order confirmed - ${order.order_number}`,
      htmlContent: buildOrderConfirmationHtml(order),
    })
  } catch (error) {
    await releaseOrderConfirmationEmailClaim(adminClient, orderId, sentAt)
    throw error
  }
}

export async function trySendOrderConfirmationEmail(adminClient: any, orderId: string) {
  try {
    await sendOrderConfirmationEmailOnce(adminClient, orderId)
  } catch (error) {
    console.error('Failed to send order confirmation email', {
      orderId,
      error,
    })
  }
}
