import { requireAdmin } from '@/lib/adminAuth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  User,
  MapPin,
  Package,
  CreditCard,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
} from 'lucide-react'
import { OrderStatusManager } from '../_components/OrderStatusManager'
import { ShiprocketPanel } from '../_components/ShiprocketPanel'
import { DeleteOrderButton } from '../_components/DeleteOrderButton'
import { CopyIdButton } from '../_components/CopyIdButton'

export const metadata = {
  title: 'Order Details | Admin – Teenzos',
}

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(ts: string | null | undefined) {
  if (!ts) return null
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_BADGE: Record<string, string> = {
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped:   'bg-cyan-50 text-cyan-700 border-cyan-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed:    'bg-red-50 text-red-700 border-red-200',
  refunded:  'bg-amber-50 text-amber-700 border-amber-200',
}
function badge(val: string) {
  return STATUS_BADGE[val] ?? 'bg-amber-50 text-amber-700 border-amber-200'
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: orderId } = await params
  const admin = await requireAdmin()
  if (admin.ok === false) notFound()
  const supabase = admin.adminClient

  const { data: order, error: orderError } = await supabase
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
        alternate_phone,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code
      ),
      order_items (*)
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) notFound()

  // Thumbnail images for each item
  const productIds = Array.from(
    new Set(
      (order.order_items ?? []).map((i: any) => i.product_id).filter(Boolean)
    )
  )
  let productsById: Record<string, { image_url: string | null; is_active: boolean }> = {}
  if (productIds.length) {
    const { data: productsData } = await supabase
      .from('products')
      .select('id, is_active, featured_image_url, product_images ( image_url )')
      .in('id', productIds)
    productsById = Object.fromEntries(
      (productsData ?? []).map((p: any) => [
        p.id,
        {
          image_url: p.product_images?.[0]?.image_url ?? p.featured_image_url ?? null,
          is_active: p.is_active,
        },
      ])
    )
  }

  const items: any[] = order.order_items ?? []
  const totalUnits = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0)

  const subtotal: number = Number(order.subtotal ?? order.total_amount ?? 0)
  const shippingCost: number = Number(order.shipping_cost ?? 0)
  const totalAmount: number = Number(order.total_amount ?? 0)

  // Timeline events
  const timelineEvents = [
    { label: 'Order Placed',  ts: order.created_at,   icon: CheckCircle2, color: 'text-pink'           },
    { label: 'Payment Received', ts: order.paid_at,   icon: CreditCard,   color: 'text-emerald-600'    },
    { label: 'Shipped',       ts: order.shipped_at,   icon: Truck,        color: 'text-cyan-600'        },
    { label: 'Delivered',     ts: order.delivered_at, icon: CheckCircle2, color: 'text-emerald-700'     },
    { label: 'Cancelled',     ts: order.cancelled_at, icon: Clock,        color: 'text-red-500'         },
  ].filter((e) => e.ts)

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 bg-panel hover:bg-cream-deep border border-cream-line text-ink/60 hover:text-ink rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-ink">
                Order #{order.order_number}
              </h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border capitalize ${badge(order.order_status)}`}>
                {order.order_status}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border capitalize ${badge(order.payment_status)}`}>
                {order.payment_status}
              </span>
            </div>
            <p className="text-sm text-ink/40 mt-0.5">
              Placed {fmt(order.created_at)}
            </p>
          </div>
        </div>

        <DeleteOrderButton orderId={order.id} redirectAfter />
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* ── LEFT (2/3) ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4 min-w-0">

          {/* Customer + Shipping Address (side by side on sm+) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Customer card */}
            <div className="bg-panel rounded-2xl border border-cream-line p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-cream-line">
                <User className="w-4 h-4 text-pink" />
                <h3 className="text-base font-bold text-ink">Customer</h3>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-base text-ink">
                  {order.profiles?.full_name ?? order.addresses?.full_name ?? 'Guest'}
                </p>
                <p className="text-ink/60 text-sm">{order.profiles?.email ?? '—'}</p>
                {(order.profiles?.phone ?? order.addresses?.phone) && (
                  <p className="text-ink/70 text-sm">
                    📞 {order.profiles?.phone ?? order.addresses?.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Address card */}
            <div className="bg-panel rounded-2xl border border-cream-line p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-cream-line">
                <MapPin className="w-4 h-4 text-pink" />
                <h3 className="text-base font-bold text-ink">Shipping Address</h3>
              </div>
              {order.addresses ? (
                <div className="text-sm text-ink/70 space-y-0.5 leading-relaxed">
                  {order.addresses.full_name && (
                    <p className="font-semibold text-base text-ink">{order.addresses.full_name}</p>
                  )}
                  <p>{order.addresses.address_line_1}</p>
                  {order.addresses.address_line_2 && <p>{order.addresses.address_line_2}</p>}
                  <p>
                    {order.addresses.city}, {order.addresses.state} – {order.addresses.postal_code}
                  </p>
                  {order.addresses.phone && (
                    <p className="text-xs text-ink/50">📞 {order.addresses.phone}</p>
                  )}
                  {order.addresses.alternate_phone && (
                    <p className="text-xs text-ink/40">Alt: {order.addresses.alternate_phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink/40 italic">No address saved.</p>
              )}
            </div>
          </div>

          {/* Order Items table */}
          <div className="bg-panel rounded-2xl border border-cream-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-line">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-ink/40" />
                <h3 className="text-base font-bold text-ink">
                  Items Ordered ({totalUnits})
                </h3>
              </div>
              <span className="text-sm text-ink/50">
                Total:{' '}
                <strong className="text-ink">₹{totalAmount.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-cream-deep text-ink/40 uppercase tracking-wider text-xs border-b border-cream-line">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Variant</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-line">
                  {items.map((item: any) => {
                    const prod = item.product_id ? productsById[item.product_id] : null
                    const shopHref = prod?.is_active ? `/shop/${item.product_id}` : null

                    const thumb = (
                      <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-cream-line bg-cream-deep">
                        {prod?.image_url ? (
                          <Image src={prod.image_url} alt={item.product_name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-ink/30 font-bold">IMG</div>
                        )}
                      </div>
                    )

                    return (
                      <tr key={item.id} className="hover:bg-cream-deep/40 transition-colors">
                        <td className="px-5 py-3">
                          {shopHref ? (
                            <Link href={shopHref} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2.5 group">
                              {thumb}
                              <div className="min-w-0">
                                <span className="font-semibold text-ink group-hover:text-pink transition-colors block truncate max-w-[200px]">
                                  {item.product_name}
                                </span>
                                <span className="text-[10px] text-pink flex items-center gap-1">
                                  View <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              {thumb}
                              <span className="font-semibold text-ink truncate max-w-[200px]">
                                {item.product_name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink/60">
                          <span className="bg-cream-deep px-2.5 py-1 rounded-md text-xs font-medium">
                            {item.variant_name || 'Standard'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink/70 font-medium">
                          ₹{Number(item.price_at_purchase).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-ink font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 font-bold text-ink text-right">
                          ₹{Number(item.line_total).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT (1/3) ───────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-4">

          {/* Manage Status */}
          <OrderStatusManager
            orderId={order.id}
            initialOrderStatus={order.order_status}
            initialPaymentStatus={order.payment_status}
          />

          {/* Shiprocket */}
          <ShiprocketPanel
            orderId={order.id}
            shiprocketOrderId={order.shiprocket_order_id ?? null}
            shiprocketShipmentId={order.shiprocket_shipment_id ?? null}
            awbCode={order.shiprocket_awb_code ?? null}
            courierName={order.courier_name ?? null}
            trackingUrl={order.tracking_url ?? null}
            pickupToken={order.shiprocket_pickup_token ?? null}
            pickupScheduledDate={order.shiprocket_pickup_scheduled_date ?? null}
            paymentMethod={order.payment_method ?? null}
            paymentStatus={order.payment_status}
            itemUnits={totalUnits}
          />

          {/* Payment Summary */}
          <div className="bg-panel rounded-2xl border border-cream-line p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-cream-line">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-ink">Payment Summary</h3>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span>
                <span className="font-medium text-ink">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Shipping</span>
                <span className="font-medium text-emerald-600">
                  {shippingCost === 0 ? 'Free' : `₹${shippingCost.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-cream-line text-base">
                <span className="font-bold text-ink">Total</span>
                <span className="font-black text-pink">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Razorpay IDs */}
            {(order.razorpay_order_id || order.razorpay_payment_id) && (
              <div className="pt-3 border-t border-cream-line space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Razorpay IDs</p>
                {order.razorpay_order_id && (
                  <div>
                    <p className="text-xs text-ink/40 mb-0.5">Order ID</p>
                    <CopyIdButton id={order.razorpay_order_id} />
                  </div>
                )}
                {order.razorpay_payment_id && (
                  <div>
                    <p className="text-xs text-ink/40 mb-0.5">Payment ID</p>
                    <CopyIdButton id={order.razorpay_payment_id} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          {timelineEvents.length > 0 && (
            <div className="bg-panel rounded-2xl border border-cream-line p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-cream-line">
                <Clock className="w-4 h-4 text-ink/40" />
                <h3 className="text-base font-bold text-ink">Timeline</h3>
              </div>

              <div className="space-y-0">
                {timelineEvents.map((ev, idx) => {
                  const Icon = ev.icon
                  const isLast = idx === timelineEvents.length - 1
                  return (
                    <div key={ev.label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-2 border-cream-line bg-panel flex items-center justify-center shrink-0 ${ev.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-cream-line my-1" />}
                      </div>
                      <div className={`${isLast ? 'pb-0' : 'pb-4'} pt-1 min-w-0`}>
                        <p className="text-sm font-semibold text-ink">{ev.label}</p>
                        <p className="text-xs text-ink/40 mt-0.5">{fmt(ev.ts)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
