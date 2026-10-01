// Plain constants only (no server-only logic) so this is safe to import from
// client components without bundling lib/shiprocket.ts into the browser.

// The "New Orders" tab in Shiprocket's dashboard, where an admin can pick a
// courier manually for an order that was pushed over from the admin panel.
export const SHIPROCKET_NEW_ORDERS_URL = 'https://app.shiprocket.in/seller/orders/new'

// Default parcel for a folded t-shirt in a poly mailer (cm / kg). The admin
// can change these per order when creating the shipment; they are only the
// pre-filled values, so nothing is configured through env vars.
export const SHIPROCKET_DEFAULT_PARCEL_CM = { length: 30, breadth: 25, height: 5 }
export const SHIPROCKET_WEIGHT_PER_ITEM_KG = 0.3

export function estimateParcelWeightKg(units: number) {
  const weight = Math.max(1, units) * SHIPROCKET_WEIGHT_PER_ITEM_KG
  return Math.max(0.1, Math.round(weight * 100) / 100)
}
