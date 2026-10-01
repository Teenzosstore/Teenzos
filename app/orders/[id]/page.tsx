import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MapPin,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getCurrentUserId } from '@/lib/auth/currentUser'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncOrderFromShiprocket } from '@/lib/shiprocketOrder'
import { getShiprocketTrackingUrl } from '@/lib/shiprocket'
import OrderDetailActions from './_components/OrderDetailActions'
import PrintReceipt from './_components/PrintReceipt'

// The title doubles as the suggested filename when the customer prints / saves
// the receipt as PDF, so it carries the order number — but only for the owner.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getCurrentUserId()
  if (userId) {
    const { data: order } = await createAdminClient()
      .from('orders')
      .select('order_number')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()
    if (order) return { title: `Teenzosstore Receipt - ${order.order_number}` }
  }
  return { title: 'Track Order | Teenzosstore' }
}

// Always render fresh — this page pulls live courier status on every view.
export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-gray-600 bg-gray-100 border-gray-200',
  processing: 'text-orange-700 bg-orange-50 border-orange-200',
  shipped: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  delivered: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
}

// Shiprocket's raw shipment status is far more granular than our 5-value
// order_status ("IN TRANSIT", "Out For Delivery", "RTO Initiated"...).
function shipmentStatusStyle(raw: string) {
  const s = raw.toLowerCase()
  if (s.includes('rto') || s.includes('cancel') || s.includes('undelivered')) return 'text-red-600 bg-red-50 border-red-200'
  if (s.includes('deliver')) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (s.includes('transit') || s.includes('out for') || s.includes('dispatch') || s.includes('pickup') || s.includes('shipped')) {
    return 'text-cyan-700 bg-cyan-50 border-cyan-200'
  }
  return 'text-orange-700 bg-orange-50 border-orange-200'
}

function scanIcon(text: string) {
  const s = text.toLowerCase()
  if (s.includes('deliver')) return CheckCircle2
  if (s.includes('transit') || s.includes('out for') || s.includes('dispatch') || s.includes('pickup')) return Truck
  return Package
}

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getCurrentUserId()
  if (!userId) redirect(`/login?redirect=/orders/${id}`)

  // Service-role read: custom-session customers have no Supabase JWT, so RLS
  // would return nothing. Ownership is enforced by the user_id filter below.
  const admin = createAdminClient()
  const orderSelect = `
    *,
    addresses:address_id (*),
    order_items (*)
  `

  let { data: order } = await admin
    .from('orders')
    .select(orderSelect)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!order) notFound()

  // Best-effort live sync with Shiprocket. If it is slow or unreachable the
  // page still renders with whatever is already stored.
  let currentLocation: string | null = null
  let shipmentStatus: string | null = null
  let scans: Array<{ date: string | null; status: string | null; activity: string | null; location: string | null }> = []
  let liveSynced = false

  if (order.shiprocket_order_id || order.shiprocket_awb_code) {
    const synced = await syncOrderFromShiprocket(admin, order.id)
    if (synced.success === true) {
      currentLocation = synced.currentLocation
      shipmentStatus = synced.shiprocketStatus
      scans = synced.scans
      liveSynced = true

      const { data: fresh } = await admin
        .from('orders')
        .select(orderSelect)
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()
      if (fresh) order = fresh
    } else {
      console.error('Live Shiprocket sync failed on customer order page:', synced.error)
    }
  }

  // Product images for the items list.
  const productIds = Array.from(new Set((order.order_items || []).map((i: any) => i.product_id).filter(Boolean)))
  const imageByProduct: Record<string, string> = {}
  if (productIds.length > 0) {
    const { data: products } = await admin
      .from('products')
      .select('id, featured_image_url')
      .in('id', productIds)
    products?.forEach((p: any) => {
      if (p.featured_image_url) imageByProduct[p.id] = p.featured_image_url
    })
  }
  const items = (order.order_items || []).map((item: any) => ({
    ...item,
    image_url: (item.product_id && imageByProduct[item.product_id]) || null,
  }))

  const address = order.addresses
  const status = (order.order_status || 'pending').toLowerCase()
  const isCancelled = status === 'cancelled'
  const awb = order.shiprocket_awb_code || order.tracking_number || null
  const trackUrl = order.tracking_url || (awb ? getShiprocketTrackingUrl(awb) : null)
  const hasShipment = Boolean(order.shiprocket_order_id || awb)
  const isOnline = /online|prepaid/i.test(order.payment_method || '')

  const STEPS = [
    { key: 'pending', title: 'Order Placed', desc: 'Received & logged', icon: Package, time: formatTime(order.created_at) },
    { key: 'processing', title: 'Processing', desc: 'Packing your order', icon: PackageCheck, time: null },
    { key: 'shipped', title: 'Shipped', desc: 'In transit with courier', icon: Truck, time: formatTime(order.shipped_at) },
    { key: 'delivered', title: 'Delivered', desc: 'Package delivered', icon: CheckCircle2, time: formatTime(order.delivered_at) },
  ]
  const currentStep = isCancelled ? -1 : Math.max(1, STEPS.findIndex((s) => s.key === status) + 1)

  const sortedScans = [...scans].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0
    const tb = b.date ? new Date(b.date).getTime() : 0
    return tb - ta
  })

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>
      <main className="min-h-screen bg-[#F7F7F5] pt-24 pb-16 md:pt-32 md:pb-24 print:min-h-0 print:bg-white print:p-0 print:m-0">
        <PrintReceipt order={order} items={items} address={address} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 print:hidden">
          <Link
            href="/profile"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-pink transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to My Orders
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3 pb-6 mb-6 border-b border-gray-200">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Order <span className="text-pink">#{order.order_number}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                Placed on{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                STATUS_STYLES[status] || STATUS_STYLES.pending
              }`}
            >
              {order.order_status || 'Pending'}
            </span>
          </div>

          <div className="flex justify-end -mt-2 mb-6">
            <OrderDetailActions orderNumber={order.order_number} />
          </div>

          <div className="space-y-5">
            {/* Progress stepper */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-8">
              {isCancelled ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">This order has been cancelled</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      For refund or cancellation queries, please contact our support on WhatsApp.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-7">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink/60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-pink" />
                      </span>
                      Live Tracking Progress
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded-full" />
                    <div
                      className="absolute top-6 left-6 h-1 bg-gradient-to-r from-pink to-cyan rounded-full transition-all duration-700"
                      style={{
                        width: `calc((100% - 3rem) * ${Math.min(1, Math.max(0, (currentStep - 1) / (STEPS.length - 1)))})`,
                      }}
                    />
                    <div className="relative flex justify-between">
                      {STEPS.map((step, idx) => {
                        const isDone = currentStep >= idx + 1
                        const isCurrent = currentStep === idx + 1
                        const StepIcon = step.icon
                        return (
                          <div key={step.key} className="flex flex-col items-center max-w-[80px] sm:max-w-[110px]">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isDone
                                  ? 'bg-black text-white shadow-md'
                                  : 'bg-white border-2 border-gray-200 text-gray-300'
                              } ${isCurrent ? 'ring-4 ring-pink/25' : ''}`}
                            >
                              <StepIcon className="w-5 h-5" />
                            </div>
                            <div className="text-center mt-3 px-1">
                              <p className={`text-[11px] sm:text-xs font-bold ${isDone ? 'text-gray-900' : 'text-gray-300'}`}>
                                {step.title}
                              </p>
                              <p className="text-[10px] text-gray-400 hidden sm:block mt-0.5 leading-tight">{step.desc}</p>
                              {step.time ? (
                                <p className="text-[10px] font-bold text-pink mt-1 leading-tight">{step.time}</p>
                              ) : !isDone ? (
                                <p className="text-[10px] text-gray-300 mt-1 italic hidden sm:block">Pending</p>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Shipment tracking */}
            {hasShipment ? (
              <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Shipment Tracking</h2>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                        Powered by Shiprocket
                      </p>
                    </div>
                  </div>
                  {liveSynced && (
                    <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      Live
                    </span>
                  )}
                </div>

                {(shipmentStatus || currentLocation) && (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                    {shipmentStatus && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border ${shipmentStatusStyle(
                          shipmentStatus
                        )}`}
                      >
                        {shipmentStatus.toLowerCase().includes('deliver') &&
                          !/undeliver|rto/i.test(shipmentStatus) && <CheckCircle2 className="w-4 h-4" />}
                        {shipmentStatus}
                      </span>
                    )}
                    {currentLocation && (
                      <div className="flex items-center gap-2 text-right ml-auto">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Location</p>
                          <p className="font-bold text-gray-900 text-xs sm:text-sm">{currentLocation}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-pink/10 border border-pink/20 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-pink" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-4">
                  {awb && (
                    <div className="flex-1 min-w-[140px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">AWB Number</p>
                      <p className="font-mono font-bold text-gray-900 text-sm mt-0.5 select-all">{awb}</p>
                    </div>
                  )}
                  {order.courier_name && (
                    <div className="flex-1 min-w-[140px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Courier</p>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{order.courier_name}</p>
                    </div>
                  )}
                </div>

                {trackUrl && (
                  <a
                    href={trackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black hover:bg-pink text-white text-xs font-bold uppercase tracking-wide transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Track on courier site
                  </a>
                )}

                {sortedScans.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Tracking Timeline</p>
                    <div className="max-h-96 overflow-y-auto pr-1">
                      {sortedScans.map((scan, idx) => {
                        const isLatest = idx === 0
                        const Icon = scanIcon(scan.activity || scan.status || '')
                        return (
                          <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                  isLatest
                                    ? 'bg-pink text-white shadow-pink'
                                    : 'bg-white border-2 border-gray-200 text-gray-300'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              {idx !== sortedScans.length - 1 && <div className="w-px flex-1 my-1 bg-gray-200" />}
                            </div>
                            <div
                              className={`min-w-0 flex-1 ${
                                isLatest ? 'bg-pink/5 border border-pink/10 rounded-xl px-4 py-3 mb-4' : 'pb-5'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-bold ${isLatest ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {scan.activity || scan.status}
                                </p>
                                {isLatest && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-pink bg-pink/10 px-2 py-0.5 rounded-full border border-pink/20">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 mt-1 text-xs text-gray-500">
                                {scan.location && <span>{scan.location}</span>}
                                {scan.location && scan.date && <span className="text-gray-300">&middot;</span>}
                                {scan.date && <span>{formatTime(scan.date)}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !isCancelled && (
                <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Shipment Tracking</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {isOnline && order.payment_status !== 'paid'
                        ? 'We are waiting for your payment to be confirmed. Tracking will appear here once it ships.'
                        : "Your order hasn't shipped yet. As soon as it ships, detailed courier tracking will appear here."}
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Items */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-8">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-pink" />
                Items ({items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0)})
              </h2>
              <ul className="divide-y divide-gray-100">
                {items.map((item: any) => (
                  <li key={item.id} className="flex items-start gap-3 sm:gap-4 py-4">
                    <div className="relative w-16 h-20 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-wrap items-start justify-between gap-x-3">
                      <div className="min-w-0 flex-1 basis-[60%]">
                        <p className="font-bold text-gray-900 text-sm leading-snug">{item.product_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.variant_name && item.variant_name !== 'Default' && <>{item.variant_name} &middot; </>}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold text-gray-900 text-sm">
                        ₹{Number(item.line_total ?? item.price_at_purchase * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="font-bold text-gray-900">
                    {Number(order.shipping_cost) === 0 ? 'FREE' : `₹${Number(order.shipping_cost).toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-pink">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            {address && (
              <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-8">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink" />
                  Shipping Address
                </h2>
                <p className="font-bold text-gray-900 text-sm">
                  {address.full_name} &middot; {address.phone}
                </p>
                <p className="text-sm text-gray-600 mt-1.5">{address.address_line_1}</p>
                {address.address_line_2 && <p className="text-sm text-gray-600">{address.address_line_2}</p>}
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state} {address.postal_code}
                </p>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-8">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-pink" />
                Payment
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-500">Method:</span>
                <span className="font-bold text-gray-900">{order.payment_method || 'Cash on Delivery'}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                    order.payment_status === 'paid'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}
                >
                  {order.payment_status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {order.payment_status || 'Pending'}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Payment ID</p>
                  <p className="font-mono text-sm text-gray-700 select-all bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 inline-block">
                    {order.razorpay_payment_id}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  )
}
