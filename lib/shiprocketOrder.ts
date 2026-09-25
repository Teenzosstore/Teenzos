import {
  assignShiprocketAwb,
  createShiprocketOrder,
  getDefaultShiprocketParcel,
  getShiprocketConfig,
  getShiprocketTrackingUrl,
  requestShiprocketPickup,
  type ShiprocketParcel,
} from '@/lib/shiprocket'

export type ShiprocketOrderActionResult = {
  success: boolean
  error?: string
}

function formatShiprocketOrderDate(value: string) {
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    ' ',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('')
}

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return fallback

  return numberValue
}

function normalizePhone(value: string | null | undefined) {
  return (value || '').replace(/\D/g, '').slice(-10)
}

function buildParcel(input?: Partial<ShiprocketParcel>): ShiprocketParcel {
  const defaults = getDefaultShiprocketParcel()

  return {
    length: toNumber(input?.length, defaults.length),
    breadth: toNumber(input?.breadth, defaults.breadth),
    height: toNumber(input?.height, defaults.height),
    weight: toNumber(input?.weight, defaults.weight),
  }
}

function isPrepaidOrder(order: any) {
  const method = (order.payment_method || '').toLowerCase()
  return method.includes('prepaid') || method.includes('online')
}

function getPaymentMethodForShiprocket(order: any) {
  return isPrepaidOrder(order) ? 'Prepaid' : 'COD'
}

function buildShiprocketPayload(order: any, parcel: ShiprocketParcel) {
  const config = getShiprocketConfig()
  const address = order.addresses
  const profile = order.profiles
  const phone = normalizePhone(address?.phone || profile?.phone)

  if (!address) {
    throw new Error('Order has no shipping address')
  }

  if (!phone || phone.length !== 10) {
    throw new Error('Customer phone must be a valid 10 digit number')
  }

  if (!order.order_items?.length) {
    throw new Error('Order has no items')
  }

  const payload: any = {
    order_id: order.order_number,
    order_date: formatShiprocketOrderDate(order.created_at),
    pickup_location: config.pickupLocation,
    billing_customer_name: address.full_name || profile?.full_name || 'Customer',
    billing_last_name: '',
    billing_address: address.address_line_1,
    billing_address_2: address.address_line_2 || '',
    billing_city: address.city,
    billing_pincode: address.postal_code,
    billing_state: address.state,
    billing_country: address.country || 'India',
    billing_email: profile?.email || '',
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: order.order_items.map((item: any) => ({
      name: item.product_name,
      sku: item.variant_id || item.product_id || item.id,
      units: Number(item.quantity),
      selling_price: Number(item.price_at_purchase),
      discount: 0,
      tax: 0,
      hsn: '',
    })),
    payment_method: getPaymentMethodForShiprocket(order),
    shipping_charges: Number(order.shipping_cost || 0),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: Number(order.subtotal || 0),
    length: parcel.length,
    breadth: parcel.breadth,
    height: parcel.height,
    weight: parcel.weight,
  }

  if (config.channelId) {
    payload.channel_id = config.channelId
  }

  return payload
}

async function loadOrderForShiprocket(adminClient: any, orderId: string) {
  const { data: order, error } = await adminClient
    .from('orders')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email,
        phone
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
      order_items (*)
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    throw new Error(error?.message || 'Order not found')
  }

  return order
}

export async function createShiprocketShipmentForOrder(
  adminClient: any,
  orderId: string,
  parcelInput?: Partial<ShiprocketParcel>
): Promise<ShiprocketOrderActionResult> {
  try {
    const order = await loadOrderForShiprocket(adminClient, orderId)

    if (order.shiprocket_shipment_id) {
      return { success: true }
    }

    if (isPrepaidOrder(order) && order.payment_status !== 'paid') {
      return { success: false, error: 'Prepaid orders must be paid before creating a shipment' }
    }

    const parcel = buildParcel(parcelInput)
    const response = await createShiprocketOrder(buildShiprocketPayload(order, parcel))

    if (!response.order_id || !response.shipment_id) {
      return { success: false, error: response.message || 'Shiprocket did not return order and shipment IDs' }
    }

    const { error } = await adminClient
      .from('orders')
      .update({
        shiprocket_order_id: String(response.order_id),
        shiprocket_shipment_id: String(response.shipment_id),
        courier_name: 'Shiprocket',
        shipment_notes: `Shiprocket shipment created. Shipment ID: ${response.shipment_id}`,
      })
      .eq('id', orderId)

    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create Shiprocket shipment' }
  }
}

export async function assignShiprocketAwbForOrder(
  adminClient: any,
  orderId: string,
  courierIdInput?: string
): Promise<ShiprocketOrderActionResult> {
  try {
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('shiprocket_shipment_id, shiprocket_awb_code')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: orderError?.message || 'Order not found' }
    }

    if (!order.shiprocket_shipment_id) {
      return { success: false, error: 'Create the Shiprocket shipment before assigning AWB' }
    }

    if (order.shiprocket_awb_code) {
      return { success: true }
    }

    const envCourierId = process.env.SHIPROCKET_DEFAULT_COURIER_ID?.trim()
    const courierId = Number(courierIdInput || envCourierId || 0) || undefined
    const response = await assignShiprocketAwb(Number(order.shiprocket_shipment_id), courierId)
    const data = response.response?.data
    const awbCode = data?.awb_code

    if (!awbCode) {
      return { success: false, error: response.message || 'Shiprocket did not return an AWB code' }
    }

    const { error } = await adminClient
      .from('orders')
      .update({
        shiprocket_awb_code: awbCode,
        shiprocket_courier_company_id: data?.courier_company_id ? String(data.courier_company_id) : null,
        courier_name: data?.courier_name || 'Shiprocket',
        tracking_number: awbCode,
        tracking_url: getShiprocketTrackingUrl(awbCode),
        order_status: 'processing',
        shipment_notes: `Shiprocket AWB assigned. AWB: ${awbCode}`,
      })
      .eq('id', orderId)

    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to assign Shiprocket AWB' }
  }
}

export async function scheduleShiprocketPickupForOrderWithClient(
  adminClient: any,
  orderId: string
): Promise<ShiprocketOrderActionResult> {
  try {
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('shiprocket_shipment_id, shiprocket_awb_code')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: orderError?.message || 'Order not found' }
    }

    if (!order.shiprocket_shipment_id) {
      return { success: false, error: 'Create the Shiprocket shipment before scheduling pickup' }
    }

    if (!order.shiprocket_awb_code) {
      return { success: false, error: 'Assign AWB before scheduling pickup' }
    }

    const response = await requestShiprocketPickup(Number(order.shiprocket_shipment_id))
    if (response.pickup_status !== 1) {
      return { success: false, error: response.message || 'Shiprocket pickup was not scheduled' }
    }

    const pickupDate = response.response?.pickup_scheduled_date || null
    const pickupToken = response.response?.pickup_token_number || null
    const { error } = await adminClient
      .from('orders')
      .update({
        shiprocket_pickup_token: pickupToken,
        shiprocket_pickup_scheduled_date: pickupDate,
        shipment_notes: pickupToken || pickupDate
          ? `Shiprocket pickup scheduled. ${pickupToken || ''} ${pickupDate || ''}`.trim()
          : 'Shiprocket pickup scheduled.',
      })
      .eq('id', orderId)

    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to schedule Shiprocket pickup' }
  }
}

export async function createShiprocketShipmentAndAssignAwbForOrder(
  adminClient: any,
  orderId: string
): Promise<ShiprocketOrderActionResult> {
  const shipmentResult = await createShiprocketShipmentForOrder(adminClient, orderId)
  if (!shipmentResult.success) {
    return shipmentResult
  }

  return assignShiprocketAwbForOrder(adminClient, orderId)
}

export async function tryCreateShiprocketShipmentAndAssignAwbForOrder(adminClient: any, orderId: string) {
  const result = await createShiprocketShipmentAndAssignAwbForOrder(adminClient, orderId)

  if (!result.success) {
    console.error('Failed to automate Shiprocket shipment and AWB', {
      orderId,
      error: result.error,
    })
  }

  return result
}
