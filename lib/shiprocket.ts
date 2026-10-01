import { SHIPROCKET_DEFAULT_PARCEL_CM, SHIPROCKET_WEIGHT_PER_ITEM_KG } from '@/lib/shiprocket-constants'
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external'

type ShiprocketConfig = {
  email: string
  password: string
  pickupLocation: string
  channelId: number | null
}

export type ShiprocketParcel = {
  length: number
  breadth: number
  height: number
  weight: number
}

export type ShiprocketOrderPayload = {
  order_id: string
  order_date: string
  pickup_location: string
  channel_id?: number
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_address_2: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  order_items: Array<{
    name: string
    sku: string
    units: number
    selling_price: number
    discount: number
    tax: number
    hsn: string
  }>
  payment_method: 'COD' | 'Prepaid'
  shipping_charges: number
  giftwrap_charges: number
  transaction_charges: number
  total_discount: number
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

export type ShiprocketCreateOrderResponse = {
  order_id?: number
  shipment_id?: number
  status?: string
  status_code?: number
  message?: string
}

export type ShiprocketAwbResponse = {
  awb_assign_status?: number
  response?: {
    data?: {
      courier_company_id?: number
      courier_name?: string
      awb_code?: string
      order_id?: number
      shipment_id?: number
    }
  }
  message?: string
}

export type ShiprocketPickupResponse = {
  pickup_status?: number
  response?: {
    pickup_scheduled_date?: string
    pickup_token_number?: string
  }
  message?: string
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is not configured`)
  }

  return value
}

export function getShiprocketConfig(): ShiprocketConfig {
  const channelId = process.env.SHIPROCKET_CHANNEL_ID?.trim()

  return {
    email: requiredEnv('SHIPROCKET_EMAIL'),
    password: requiredEnv('SHIPROCKET_PASSWORD'),
    pickupLocation: requiredEnv('SHIPROCKET_PICKUP_LOCATION'),
    channelId: channelId ? Number(channelId) : null,
  }
}

export function getDefaultShiprocketParcel(): ShiprocketParcel {
  return {
    ...SHIPROCKET_DEFAULT_PARCEL_CM,
    weight: SHIPROCKET_WEIGHT_PER_ITEM_KG,
  }
}

function validateParcel(parcel: ShiprocketParcel) {
  const values = [parcel.length, parcel.breadth, parcel.height, parcel.weight]
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Shipment dimensions and weight must be greater than zero')
  }
}

async function parseShiprocketResponse(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function shiprocketErrorMessage(payload: any, status: number) {
  if (typeof payload === 'string') return payload
  if (payload?.message) return payload.message
  if (payload?.error) return payload.error
  if (payload?.errors) return JSON.stringify(payload.errors)

  return `Shiprocket request failed with status ${status}`
}

async function shiprocketRequest<T>(
  path: string,
  token: string,
  options: {
    method: 'GET' | 'POST'
    body?: unknown
  },
  retry = true
): Promise<T> {
  const response = await fetch(`${SHIPROCKET_BASE_URL}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  // A cached token can be rejected (expired / revoked): drop it, log in again
  // and retry exactly once before giving up.
  if (response.status === 401 && retry) {
    cachedToken = null
    return shiprocketRequest<T>(path, await getShiprocketToken(), options, false)
  }

  const payload = await parseShiprocketResponse(response)

  if (!response.ok) {
    throw new Error(shiprocketErrorMessage(payload, response.status))
  }

  return payload as T
}

// Shiprocket tokens stay valid for days; logging in on every call (each
// customer page view, each admin sync) is slow and risks rate limits, so keep
// one per server instance for a few hours.
let cachedToken: { value: string; expiresAt: number } | null = null
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000

export async function getShiprocketToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value

  const config = getShiprocketConfig()

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: config.email,
      password: config.password,
    }),
  })

  const payload = await parseShiprocketResponse(response)
  if (!response.ok) {
    throw new Error(shiprocketErrorMessage(payload, response.status))
  }

  const token = (payload as any)?.token
  if (!token) {
    throw new Error('Shiprocket did not return an auth token')
  }

  cachedToken = { value: token as string, expiresAt: Date.now() + TOKEN_TTL_MS }
  return token as string
}

export async function createShiprocketOrder(payload: ShiprocketOrderPayload) {
  validateParcel({
    length: payload.length,
    breadth: payload.breadth,
    height: payload.height,
    weight: payload.weight,
  })

  const token = await getShiprocketToken()
  return shiprocketRequest<ShiprocketCreateOrderResponse>('/orders/create/adhoc', token, {
    method: 'POST',
    body: payload,
  })
}

export async function assignShiprocketAwb(shipmentId: number, courierId?: number) {
  const token = await getShiprocketToken()
  const body: Record<string, number> = {
    shipment_id: shipmentId,
  }

  if (courierId) {
    body.courier_id = courierId
  }

  return shiprocketRequest<ShiprocketAwbResponse>('/courier/assign/awb', token, {
    method: 'POST',
    body,
  })
}

export async function requestShiprocketPickup(shipmentId: number) {
  const token = await getShiprocketToken()
  return shiprocketRequest<ShiprocketPickupResponse>('/courier/generate/pickup', token, {
    method: 'POST',
    body: {
      shipment_id: [shipmentId],
    },
  })
}

export function getShiprocketTrackingUrl(awbCode: string) {
  return `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}`
}

// Collapses Shiprocket's many shipment statuses into the order_status values
// the rest of the app understands. Returns null when the status shouldn't
// move the order (pickup scheduled, label generated, etc.).
export function mapShiprocketStatusToOrderStatus(currentStatus: string | undefined | null): string | null {
  if (!currentStatus) return null
  const s = currentStatus.toLowerCase()

  // RTO / undelivered must be checked before "delivered" — "RTO Delivered"
  // and "Undelivered" both contain that word but mean the parcel came back.
  if (/\brto\b/.test(s) || s.includes('undelivered') || s.includes('return')) return 'cancelled'
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('delivered')) return 'delivered'
  if (s.includes('out for delivery') || s.includes('in transit') || s.includes('shipped') || s.includes('picked up')) {
    return 'shipped'
  }
  return null
}

export type ShiprocketScanEvent = {
  date: string | null
  status: string | null
  activity: string | null
  location: string | null
}

// Pull-based status check for a shipment that already has an AWB. Used by the
// admin panel's refresh / "Sync All" for orders whose webhook update never
// arrived, and to show the scan-by-scan timeline (where the parcel is now).
export async function trackShipmentByAwb(awbCode: string) {
  const token = await getShiprocketToken()
  const data = await shiprocketRequest<any>(`/courier/track/awb/${encodeURIComponent(awbCode)}`, token, {
    method: 'GET',
  })

  const shipmentData = data?.tracking_data?.shipment_track?.[0]
  const activities: any[] = data?.tracking_data?.shipment_track_activities || []

  const scans: ShiprocketScanEvent[] = activities.map((a) => ({
    date: a?.date ? String(a.date) : null,
    status: a?.status ? String(a.status) : null,
    activity: a?.activity ? String(a.activity) : null,
    location: a?.location ? String(a.location) : null,
  }))

  return {
    currentStatus: shipmentData?.current_status ? String(shipmentData.current_status) : null,
    courierName: shipmentData?.courier_name ? String(shipmentData.courier_name) : null,
    currentLocation: scans[0]?.location || null,
    scans,
  }
}

// For a shipment with no AWB in our DB yet — asks Shiprocket for the order
// itself. This picks up the current order status ("NEW", "READY TO SHIP"...)
// and, if an admin chose the courier directly in Shiprocket's dashboard, the
// AWB and courier too, even if the webhook for it never reached us.
export async function getShiprocketOrderStatus(shiprocketOrderId: string) {
  const token = await getShiprocketToken()
  const data = await shiprocketRequest<any>(`/orders/show/${encodeURIComponent(shiprocketOrderId)}`, token, {
    method: 'GET',
  })

  const order = data?.data
  // `shipments` is an object for a one-shipment order, an array when split.
  const shipment = Array.isArray(order?.shipments) ? order.shipments[0] : order?.shipments

  const awbCode =
    shipment?.awb || shipment?.awb_code || order?.last_mile_awb || order?.awb_code || order?.awb || null
  const courierName =
    shipment?.courier || shipment?.courier_name || order?.last_mile_courier_name || order?.courier_name || null

  if (!awbCode && order?.status && !/^(new|invoiced|ready to ship)$/i.test(String(order.status))) {
    // A status past "NEW" normally implies a courier — log the raw shape so
    // the real AWB field name can be identified if we still find none.
    console.warn(
      `[Shiprocket] No AWB found for order ${shiprocketOrderId} (status: ${order.status}). Raw shipments:`,
      JSON.stringify(order?.shipments)
    )
  }

  return {
    currentStatus: order?.status ? String(order.status) : null,
    awbCode: awbCode ? String(awbCode) : null,
    courierName: courierName ? String(courierName) : null,
  }
}
