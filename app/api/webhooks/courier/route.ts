import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getShiprocketTrackingUrl } from '@/lib/shiprocket'
import { buildShiprocketStatusUpdate } from '@/lib/shiprocketOrder'

// Shiprocket posts shipment status updates (picked up, in transit, out for
// delivery, delivered, RTO...) here. Register it in Shiprocket -> Settings ->
// API -> Configure Webhooks, with a "Secret Key" that you also set as
// SHIPROCKET_WEBHOOK_SECRET. Shiprocket echoes that secret back in the
// `x-api-key` header, which is how we know the call really came from them.
//
// The path deliberately avoids the words "shiprocket"/"sr"/"kr": Shiprocket
// rejects webhook URLs that contain them.
//
// Identifiers in the payload:
//  - `order_id` is Shiprocket's own numeric order id (our shiprocket_order_id).
//  - `channel_order_id` is the reference WE sent when creating the order,
//    which is our orders.order_number (see buildShiprocketPayload).

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET
    const receivedKey = req.headers.get('x-api-key')

    if (webhookSecret) {
      if (!receivedKey || receivedKey !== webhookSecret) {
        console.error('[Courier Webhook Error]: Missing/invalid x-api-key header.')
        return NextResponse.json({ success: false, error: 'Invalid webhook secret' }, { status: 401 })
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('[Courier Webhook Error]: SHIPROCKET_WEBHOOK_SECRET is not configured — rejecting request.')
      return NextResponse.json({ success: false, error: 'Webhook not configured' }, { status: 401 })
    } else {
      console.warn('[Courier Webhook]: SHIPROCKET_WEBHOOK_SECRET is not set — accepting unverified (dev only).')
    }

    const payload = await req.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
    }

    const channelOrderId: string | undefined = payload.channel_order_id ? String(payload.channel_order_id) : undefined
    const shiprocketOrderId: string | undefined = payload.order_id ? String(payload.order_id) : undefined
    const awbCode: string | undefined = payload.awb ? String(payload.awb) : undefined
    const courierName: string | undefined = payload.courier_name ? String(payload.courier_name) : undefined
    const currentStatus: string | undefined = payload.current_status || payload.shipment_status

    console.log('[Courier Webhook]: Received update', { channelOrderId, shiprocketOrderId, awbCode, courierName, currentStatus })

    if (!channelOrderId && !shiprocketOrderId) {
      // Nothing to match — acknowledge so Shiprocket doesn't keep retrying.
      console.warn('[Courier Webhook]: Payload had no order_id/channel_order_id, ignoring.', payload)
      return NextResponse.json({ success: true, ignored: true })
    }

    const admin = createAdminClient()

    let lookup = admin.from('orders').select('id, order_status')
    lookup = shiprocketOrderId
      ? lookup.eq('shiprocket_order_id', shiprocketOrderId)
      : lookup.eq('order_number', channelOrderId!)
    let { data: order } = await lookup.maybeSingle()

    if (!order && shiprocketOrderId && channelOrderId) {
      const fallback = await admin
        .from('orders')
        .select('id, order_status')
        .eq('order_number', channelOrderId)
        .maybeSingle()
      order = fallback.data
    }

    if (!order) {
      console.warn('[Courier Webhook]: No matching order found.', { channelOrderId, shiprocketOrderId })
      return NextResponse.json({ success: true, ignored: true })
    }

    const { update: updateData } = buildShiprocketStatusUpdate(order.order_status, currentStatus)
    updateData.updated_at = new Date().toISOString()
    if (awbCode) {
      updateData.shiprocket_awb_code = awbCode
      updateData.tracking_number = awbCode
      updateData.tracking_url = getShiprocketTrackingUrl(awbCode)
    }
    if (courierName) updateData.courier_name = courierName

    const { error } = await admin.from('orders').update(updateData).eq('id', order.id)
    if (error) {
      console.error('[Courier Webhook Error]: DB update failed:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Courier Webhook Critical Error]:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}
