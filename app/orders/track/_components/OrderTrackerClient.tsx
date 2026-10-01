'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MapPin,
  Package,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import {
  getUserOrdersAction,
  trackOrderByContactAction,
  type TrackedOrder,
} from '@/actions/orders'
import { SITE } from '@/lib/data'

const STEPS = [
  { title: 'Order Placed', desc: 'Order received & logged' },
  { title: 'Confirmed', desc: 'Verified & packing' },
  { title: 'Shipped', desc: 'In transit with courier' },
  { title: 'Out for Delivery', desc: 'Arriving today' },
  { title: 'Delivered', desc: 'Package delivered' },
]

// Maps our order_status (and, while shipped, Shiprocket's finer status) onto
// the 5 customer-facing steps. -1 = cancelled.
function getStep(order: TrackedOrder) {
  const status = (order.order_status || 'pending').toLowerCase()
  if (status === 'cancelled') return -1
  if (status === 'delivered') return 5
  if (status === 'shipped') {
    return /out for delivery/i.test(order.shipment?.status || '') ? 4 : 3
  }
  if (status === 'processing') return 2
  return 1
}

function shipmentStatusStyle(raw: string) {
  const s = raw.toLowerCase()
  if (s.includes('rto') || s.includes('cancel') || s.includes('undelivered')) return 'text-red-600 bg-red-50 border-red-200'
  if (s.includes('deliver')) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (s.includes('transit') || s.includes('out for') || s.includes('dispatch') || s.includes('pickup') || s.includes('shipped')) {
    return 'text-cyan-700 bg-cyan-50 border-cyan-200'
  }
  return 'text-orange-700 bg-orange-50 border-orange-200'
}

const formatTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    : null

export default function OrderTrackerClient({
  initialOrderNumber = '',
  initialContact = '',
}: {
  initialOrderNumber?: string
  initialContact?: string
}) {
  const [activeTab, setActiveTab] = useState<'track' | 'history'>('track')

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [contact, setContact] = useState(initialContact)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null)

  const [historyOrders, setHistoryOrders] = useState<TrackedOrder[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFetched, setHistoryFetched] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [historySearch, setHistorySearch] = useState('')

  const handleTrack = async (num = orderNumber, contactValue = contact) => {
    if (!num.trim()) {
      setError('Please enter your Order Number.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await trackOrderByContactAction(num, contactValue)
      if (res.success === false) {
        setError(res.error)
        setTrackedOrder(null)
      } else {
        setTrackedOrder(res.order)
        window.history.replaceState({}, '', `/orders/track?orderNumber=${encodeURIComponent(res.order.order_number)}`)
      }
    } catch {
      setError('An unexpected error occurred while tracking. Please try again.')
      setTrackedOrder(null)
    } finally {
      setLoading(false)
    }
  }

  // Auto-search when opened from a link (?orderNumber=...).
  useEffect(() => {
    if (initialOrderNumber) handleTrack(initialOrderNumber, initialContact)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab !== 'history' || historyFetched) return
    setHistoryLoading(true)
    getUserOrdersAction()
      .then((res) => {
        if (res.success === true) setHistoryOrders(res.orders)
        else if (res.isGuest) setIsGuest(true)
      })
      .catch((e) => console.error('Error fetching order history:', e))
      .finally(() => {
        setHistoryLoading(false)
        setHistoryFetched(true)
      })
  }, [activeTab, historyFetched])

  const openFromHistory = (order: TrackedOrder) => {
    setOrderNumber(order.order_number)
    setActiveTab('track')
    window.scrollTo({ top: 120, behavior: 'smooth' })
    // Owner is logged in, so no contact is needed — this also pulls live courier data.
    handleTrack(order.order_number, '')
  }

  const currentStep = trackedOrder ? getStep(trackedOrder) : 0
  const shipment = trackedOrder?.shipment || null
  const sortedScans = [...(shipment?.scans || [])].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0
    const tb = b.date ? new Date(b.date).getTime() : 0
    return tb - ta
  })

  const filteredHistory = historyOrders.filter((o) => {
    const term = historySearch.trim().toLowerCase()
    if (!term) return true
    return (
      o.order_number.toLowerCase().includes(term) ||
      o.order_items.some((i) => i.product_name?.toLowerCase().includes(term))
    )
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex bg-white p-1.5 rounded-full border border-gray-200 shadow-sm gap-1">
          {(
            [
              ['track', 'Track Current Order', Search],
              ['history', 'Order History', Package],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === key ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TRACK ================= */}
      {activeTab === 'track' && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-200/90 shadow-sm">
            <div className="max-w-xl mx-auto text-center mb-6">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2">Track Your Shipment</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Enter your Order Number and the email or phone you used at checkout to see live tracking details.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleTrack()
              }}
              className="max-w-2xl mx-auto space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Order Number <span className="text-pink">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. TZ-839102-123"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all font-mono text-sm uppercase"
                    />
                    <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="name@example.com or 9876543210"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black hover:bg-pink text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Locating Order...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Track Order Status
                  </>
                )}
              </button>
            </form>
          </div>

          {trackedOrder && (
            <div className="space-y-8 animate-fade-in-up">
              {/* Header + stepper */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/90 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Order</span>
                      <span className="bg-pink/10 text-pink font-mono font-bold px-3 py-1 rounded-full text-sm border border-pink/20">
                        #{trackedOrder.order_number}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Placed on{' '}
                      {new Date(trackedOrder.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {trackedOrder.id && (
                      <Link
                        href={`/orders/${trackedOrder.id}`}
                        className="px-4 py-2.5 border border-gray-300 hover:border-pink hover:text-pink text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
                      >
                        Full Order Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <a
                      href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hi, I need assistance with my Order #${trackedOrder.order_number}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
                    >
                      <PhoneCall className="w-4 h-4" />
                      WhatsApp Support
                    </a>
                  </div>
                </div>

                {currentStep === -1 ? (
                  <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4">
                    <XCircle className="w-10 h-10 text-red-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 text-base">This Order Has Been Cancelled</h4>
                      <p className="text-xs text-red-600 mt-1">
                        For questions about refunds or cancellation, please reach out to customer support.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live Tracking Progress</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-pink bg-pink/10 px-3 py-1 rounded-full border border-pink/20">
                        {trackedOrder.order_status}
                      </span>
                    </div>
                    <div className="relative my-8">
                      <div className="absolute top-5 md:top-6 left-5 right-5 md:left-6 md:right-6 h-1.5 bg-gray-200 rounded-full" />
                      <div
                        className="absolute top-5 md:top-6 left-5 md:left-6 h-1.5 bg-gradient-to-r from-pink to-cyan rounded-full transition-all duration-500"
                        style={{
                          width: `calc((100% - 2.5rem) * ${Math.min(1, Math.max(0, (currentStep - 1) / (STEPS.length - 1)))})`,
                        }}
                      />
                      <div className="relative flex justify-between">
                        {STEPS.map((step, idx) => {
                          const isDone = currentStep >= idx + 1
                          const isCurrent = currentStep === idx + 1
                          return (
                            <div key={step.title} className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-md transition-all ${
                                  isDone ? 'bg-black text-white' : 'bg-white border-2 border-gray-200 text-gray-400'
                                } ${isCurrent ? 'ring-4 ring-pink/25' : ''}`}
                              >
                                {isDone ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <span>{idx + 1}</span>}
                              </div>
                              <div className="text-center mt-3 max-w-[70px] md:max-w-[110px]">
                                <p className={`text-[11px] md:text-sm font-bold leading-tight ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {step.title}
                                </p>
                                <p className="text-[10px] text-gray-400 hidden md:block mt-0.5 leading-tight">{step.desc}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live shipment (Shiprocket) */}
              {shipment && (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/90 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-gray-900 leading-tight">Shipment Tracking</h3>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                          Powered by Shiprocket
                        </p>
                      </div>
                    </div>
                    {shipment.live && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/60" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    )}
                  </div>

                  {(shipment.status || shipment.location) && (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                      {shipment.status && (
                        <span
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border ${shipmentStatusStyle(
                            shipment.status
                          )}`}
                        >
                          {shipment.status}
                        </span>
                      )}
                      {shipment.location && (
                        <div className="flex items-center gap-2 text-right ml-auto">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Location</p>
                            <p className="font-bold text-gray-900 text-xs sm:text-sm">{shipment.location}</p>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-pink/10 border border-pink/20 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-pink" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    {shipment.awb && (
                      <div className="flex-1 min-w-[140px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">AWB Number</p>
                        <p className="font-mono font-bold text-gray-900 text-sm mt-0.5 select-all">{shipment.awb}</p>
                      </div>
                    )}
                    {shipment.courier && (
                      <div className="flex-1 min-w-[140px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Courier</p>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{shipment.courier}</p>
                      </div>
                    )}
                  </div>

                  {!shipment.awb && (
                    <p className="text-sm text-gray-500 mt-4">
                      Your order is packed and handed to our shipping partner. Courier details and the tracking number will
                      appear here as soon as it is picked up.
                    </p>
                  )}

                  {shipment.trackingUrl && (
                    <a
                      href={shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black hover:bg-pink text-white text-xs font-bold uppercase tracking-wide transition-colors"
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
                          return (
                            <div key={idx} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${isLatest ? 'bg-pink ring-4 ring-pink/20' : 'bg-gray-300'}`}
                                />
                                {idx !== sortedScans.length - 1 && <div className="w-px flex-1 my-1 bg-gray-200" />}
                              </div>
                              <div className="pb-5 min-w-0 flex-1">
                                <p className={`text-sm font-bold ${isLatest ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {scan.activity || scan.status}
                                  {isLatest && (
                                    <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-pink bg-pink/10 px-2 py-0.5 rounded-full border border-pink/20">
                                      Latest
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {[scan.location, formatTime(scan.date)].filter(Boolean).join(' · ')}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items + address + payment */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/90 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2 pb-4 border-b border-gray-100">
                      <ShoppingBag className="w-5 h-5 text-pink" />
                      Items Ordered ({trackedOrder.order_items.reduce((sum, i) => sum + i.quantity, 0)})
                    </h3>
                    <div className="divide-y divide-gray-100">
                      {trackedOrder.order_items.map((item) => (
                        <div key={item.id} className="py-4 flex items-center gap-4">
                          <div className="w-16 h-20 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden relative shrink-0">
                            {item.image_url ? (
                              <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{item.product_name}</h4>
                            {item.variant_name && item.variant_name !== 'Default' && (
                              <span className="inline-block bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-md mt-1">
                                {item.variant_name}
                              </span>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Qty: <span className="font-bold text-gray-900">{item.quantity}</span> × ₹
                              {item.price_at_purchase.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="text-right font-bold text-gray-900 text-sm">
                            ₹{(item.line_total ?? item.price_at_purchase * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-3">
                    <h3 className="font-display text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                      <MapPin className="w-4 h-4 text-pink" />
                      Delivery Address
                    </h3>
                    {trackedOrder.address ? (
                      <div className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
                        <p className="font-bold text-gray-900 text-sm">{trackedOrder.address.full_name}</p>
                        <p>{trackedOrder.address.address_line_1}</p>
                        <p>
                          {trackedOrder.address.city}, {trackedOrder.address.state} {trackedOrder.address.postal_code}
                        </p>
                        <p className="pt-2 border-t border-gray-100 font-semibold text-gray-700">
                          Phone: {trackedOrder.address.phone || 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Shipping address saved with the order.</p>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-3">
                    <h3 className="font-display text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                      <CreditCard className="w-4 h-4 text-pink" />
                      Payment Summary
                    </h3>
                    <div className="space-y-2.5 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-bold text-gray-900">₹{trackedOrder.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="font-bold text-gray-900">
                          {trackedOrder.shipping_cost === 0 ? 'FREE' : `₹${trackedOrder.shipping_cost.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Method</span>
                        <span className="font-bold text-gray-900 text-right">{trackedOrder.payment_method || 'Cash on Delivery'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span>Payment Status</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                            trackedOrder.payment_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {trackedOrder.payment_status || 'pending'}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-900">
                        <span>Total</span>
                        <span className="text-base text-pink">₹{trackedOrder.total_amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= HISTORY ================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">Your Order History</h2>
              <p className="text-xs text-gray-500 mt-1">View all your past and current orders.</p>
            </div>
            {!isGuest && historyOrders.length > 0 && (
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search by order # or product..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50/70 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
            )}
          </div>

          {historyLoading ? (
            <div className="text-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-pink mx-auto" />
              <p className="text-sm font-semibold text-gray-500">Fetching your orders...</p>
            </div>
          ) : isGuest ? (
            <div className="text-center py-12 px-4 max-w-md mx-auto bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <ShieldCheck className="w-12 h-12 text-pink mx-auto" />
              <h3 className="font-bold text-lg text-gray-900">Sign In to View Full Order History</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Log in to see your complete order history and live tracking for every order.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login?redirect=/orders/track"
                  className="px-6 py-2.5 bg-black text-white font-bold text-xs rounded-full shadow-md hover:bg-pink transition-all"
                >
                  Log In Now
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('track')}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-800 font-bold text-xs rounded-full hover:bg-gray-50 transition-all"
                >
                  Track Guest Order
                </button>
              </div>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="space-y-4">
              {filteredHistory.map((ord) => (
                <div
                  key={ord.order_number}
                  className="border border-gray-200 hover:border-pink/40 rounded-2xl p-5 md:p-6 bg-white transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-gray-900 text-base">Order #{ord.order_number}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          ord.order_status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ord.order_status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ord.order_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Placed on{' '}
                      {new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {ord.order_items.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className="text-xs bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 truncate max-w-[200px]"
                        >
                          {item.quantity}x {item.product_name}
                        </span>
                      ))}
                      {ord.order_items.length > 3 && (
                        <span className="text-xs text-gray-400 font-bold">+{ord.order_items.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 gap-3">
                    <div className="font-display font-bold text-pink text-lg">₹{ord.total_amount.toLocaleString('en-IN')}</div>
                    <button
                      type="button"
                      onClick={() => openFromHistory(ord)}
                      className="px-4 py-2 bg-black hover:bg-pink text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      Track Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 space-y-4">
              <Package className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold">No orders found.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold text-xs rounded-full shadow-md hover:bg-pink transition-all"
              >
                Explore the Collection <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
