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
    length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM || 10),
    breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH_CM || 10),
    height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM || 10),
    weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5),
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
  }
) {
  const response = await fetch(`${SHIPROCKET_BASE_URL}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await parseShiprocketResponse(response)

  if (!response.ok) {
    throw new Error(shiprocketErrorMessage(payload, response.status))
  }

  return payload as T
}

export async function getShiprocketToken() {
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
