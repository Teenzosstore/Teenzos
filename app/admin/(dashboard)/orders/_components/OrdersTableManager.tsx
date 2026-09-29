'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Search,
  X,
  Trash2,
  ExternalLink,
  User,
  MapPin,
  Truck,
  CreditCard,
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import {
  updateOrderStatus,
  updatePaymentStatus,
  updateDeliveryTracking,
  deleteOrder,
} from '@/actions/admin/orders'

export type OrderProfile = {
  id?: string
  full_name: string | null
  email: string | null
  phone?: string | null
}

export type OrderAddress = {
  id?: string
  full_name: string
  phone: string
  alternate_phone?: string | null
  address_line_1: string
  address_line_2?: string | null
  city: string
  state: string
  postal_code: string
}

export type OrderItem = {
  id: string
  product_id?: string
  variant_id?: string
  product_name: string
  variant_name?: string
  price_at_purchase: number
  quantity: number
  line_total: number
  image_url?: string
}

export type Order = {
  id: string
  order_number: string
  created_at: string
  user_id: string | null
  total_amount: number
  subtotal?: number
  shipping_cost?: number
  payment_status: string
  order_status: string
  payment_method?: string | null
  courier_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
  shipment_notes?: string | null
  profiles: OrderProfile | null
  addresses?: OrderAddress | null
  order_items?: OrderItem[]
}

type OrdersTableManagerProps = {
  initialOrders: Order[]
}

export function OrdersTableManager({ initialOrders }: OrdersTableManagerProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<Order[]>(initialOrders || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')

  // Selected Order for Quick View Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Tracking form inside selected order
  const [trackingCourier, setTrackingCourier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isSavingTracking, setIsSavingTracking] = useState(false)

  // Order Deletion State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // General pending state for quick status updates
  const [isUpdatingStatus, startStatusTransition] = useTransition()

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedOrder || orderToDelete) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedOrder, orderToDelete])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.profiles?.full_name || 'Guest').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.courier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.tracking_number || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesOrderStatus =
      orderStatusFilter === 'ALL' ||
      (order.order_status || '').toLowerCase() === orderStatusFilter.toLowerCase()

    const matchesPaymentStatus =
      paymentStatusFilter === 'ALL' ||
      (order.payment_status || '').toLowerCase() === paymentStatusFilter.toLowerCase()

    return matchesSearch && matchesOrderStatus && matchesPaymentStatus
  })

  const clearFilters = () => {
    setSearchTerm('')
    setOrderStatusFilter('ALL')
    setPaymentStatusFilter('ALL')
  }

  const isFiltered = searchTerm !== '' || orderStatusFilter !== 'ALL' || paymentStatusFilter !== 'ALL'

  // Open Quick View Modal
  const handleOpenQuickView = (order: Order) => {
    setSelectedOrder(order)
    setTrackingCourier(order.courier_name || '')
    setTrackingNumber(order.tracking_number || '')
  }

  // Handle Quick Order Status Change
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    startStatusTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
        )
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, order_status: newStatus } : null))
        }
        showToast(`Order status updated to ${newStatus.toUpperCase()}`, 'success')
      }
    })
  }

  // Handle Quick Payment Status Change
  const handleUpdatePaymentStatus = (orderId: string, newStatus: string) => {
    startStatusTransition(async () => {
      const res = await updatePaymentStatus(orderId, newStatus)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, payment_status: newStatus } : o))
        )
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, payment_status: newStatus } : null))
        }
        showToast(`Payment status updated to ${newStatus.toUpperCase()}`, 'success')
      }
    })
  }

  // Handle Save Tracking inside modal
  const handleSaveTracking = async () => {
    if (!selectedOrder) return
    setIsSavingTracking(true)

    const res = await updateDeliveryTracking(selectedOrder.id, {
      courier_name: trackingCourier,
      tracking_number: trackingNumber,
    })

    setIsSavingTracking(false)

    if (res.error) {
      showToast(res.error, 'error')
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, courier_name: trackingCourier, tracking_number: trackingNumber }
            : o
        )
      )
      setSelectedOrder((prev) =>
        prev ? { ...prev, courier_name: trackingCourier, tracking_number: trackingNumber } : null
      )
      showToast('Tracking details updated successfully!', 'success')
    }
  }

  // Handle Delete Order Permanently
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return
    setIsDeleting(true)

    const res = await deleteOrder(orderToDelete.id)
    setIsDeleting(false)

    if (res.error) {
      showToast(res.error, 'error')
    } else {
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id))
      if (selectedOrder && selectedOrder.id === orderToDelete.id) {
        setSelectedOrder(null)
      }
      showToast(`Order #${orderToDelete.order_number} deleted successfully!`, 'success')
      setOrderToDelete(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[110000] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white animate-fade-in ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-panel p-4 sm:p-5 rounded-2xl shadow-sm border border-cream-line flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              type="text"
              placeholder="Search order #, customer, AWB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-cream-deep border border-cream-line rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all"
            />
          </div>

          {/* Order Status Select */}
          <div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-cream-deep border border-cream-line rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all text-ink/80"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Select */}
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-cream-deep border border-cream-line rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all text-ink/80"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button & Order Counter */}
        <div className="flex items-center justify-between pt-1 border-t border-cream-line/60 text-xs">
          <span className="text-ink/60 font-medium">
            Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
          </span>

          {isFiltered && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1 bg-cream-deep hover:bg-panel2 text-ink/60 rounded-lg text-xs font-semibold transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-cream-deep text-ink/60 uppercase tracking-wider text-xs border-b border-cream-line">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Order</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Customer</th>
                <th className="px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5 font-semibold">Payment</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-line">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-ink/60">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-panel2/60 transition-colors group cursor-pointer"
                    onClick={() => handleOpenQuickView(order)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">#{order.order_number}</span>
                        {order.courier_name && (
                          <span className="text-[10px] bg-cyan-50 text-[#218D98] border border-cyan-200/80 px-1.5 py-0.5 rounded font-semibold hidden sm:inline">
                            {order.courier_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink/60">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-ink">
                          {order.profiles?.full_name || order.addresses?.full_name || 'Guest'}
                        </span>
                        <span className="text-[11px] text-ink/50">
                          {order.profiles?.email || order.addresses?.phone || 'No email'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-xs text-ink">
                        ₹{Number(order.total_amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.payment_status === 'failed'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : order.payment_status === 'refunded'
                            ? 'bg-gray-100 text-gray-700 border-gray-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200' // pending
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                          order.order_status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.order_status === 'shipped'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : order.order_status === 'processing'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : order.order_status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200' // pending
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-right space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Quick View Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickView(order)}
                        className="inline-flex items-center justify-center p-2 text-ink/60 hover:text-pink hover:bg-pink-50 rounded-xl transition-colors"
                        title="Quick View & Manage"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Full Page Link */}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center justify-center p-2 text-ink/60 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Full Order Details & Shiprocket"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setOrderToDelete(order)}
                        className="inline-flex items-center justify-center p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════
          MODERN, COMPACT & RESPONSIVE ORDER QUICK-MANAGE MODAL
         ═════════════════════════════════════════════════════════ */}
      {mounted && selectedOrder && createPortal(
        <div
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 relative space-y-4 max-h-[92vh] overflow-y-auto p-5 sm:p-6 animate-fade-in"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-gray-100">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-gray-900">
                    Order #{selectedOrder.order_number}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      selectedOrder.order_status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedOrder.order_status === 'shipped'
                        ? 'bg-cyan-50 text-[#218D98] border border-cyan-200'
                        : selectedOrder.order_status === 'cancelled'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedOrder.order_status}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      selectedOrder.payment_status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedOrder.payment_status} ({selectedOrder.payment_method || 'Online'})
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Placed on{' '}
                  {new Date(selectedOrder.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/orders/${selectedOrder.id}`}
                  className="text-xs font-bold text-pink hover:text-[#d91668] flex items-center gap-1 bg-pink-50 hover:bg-pink-100/70 px-2.5 py-1.5 rounded-xl transition-all"
                  title="Open full order manager"
                >
                  <span>Full Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-900 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2-Column Info & Controls Grid (Compact) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Card 1: Customer & Delivery Address */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-200/60 pb-1.5">
                  <User className="w-4 h-4 text-pink" />
                  <span>Customer & Shipping</span>
                </div>
                <div className="space-y-1 text-gray-700">
                  <p className="font-bold text-gray-900">
                    {selectedOrder.profiles?.full_name ||
                      selectedOrder.addresses?.full_name ||
                      'Guest Customer'}
                  </p>
                  <p className="text-gray-500">
                    {selectedOrder.profiles?.email || 'No email registered'}
                  </p>
                  {(selectedOrder.profiles?.phone || selectedOrder.addresses?.phone) && (
                    <p className="text-gray-600 font-medium">
                      Phone:{' '}
                      {selectedOrder.profiles?.phone || selectedOrder.addresses?.phone}
                    </p>
                  )}
                </div>

                <div className="pt-1.5 border-t border-gray-200/60">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                    Delivery Address:
                  </span>
                  {selectedOrder.addresses ? (
                    <p className="text-gray-600 leading-snug">
                      {selectedOrder.addresses.address_line_1}
                      {selectedOrder.addresses.address_line_2 &&
                        `, ${selectedOrder.addresses.address_line_2}`}
                      , {selectedOrder.addresses.city}, {selectedOrder.addresses.state} -{' '}
                      {selectedOrder.addresses.postal_code}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">No specific delivery address recorded.</p>
                  )}
                </div>
              </div>

              {/* Card 2: Quick Status & Tracking Management */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-200/60 pb-1.5">
                  <Truck className="w-4 h-4 text-[#36B8C5]" />
                  <span>Order & Dispatch Controls</span>
                </div>

                {/* Dropdowns row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Order Status
                    </label>
                    <select
                      value={selectedOrder.order_status}
                      disabled={isUpdatingStatus}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-pink disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Payment Status
                    </label>
                    <select
                      value={selectedOrder.payment_status}
                      disabled={isUpdatingStatus}
                      onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-pink disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                {/* Tracking & Courier Quick Inputs */}
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Courier (e.g. Delhivery)"
                      value={trackingCourier}
                      onChange={(e) => setTrackingCourier(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-pink"
                    />
                    <input
                      type="text"
                      placeholder="AWB / Tracking #"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-pink"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSavingTracking}
                    onClick={handleSaveTracking}
                    className="w-full py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    {isSavingTracking ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-pink" />
                    ) : (
                      <span>Save Courier Details</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Ordered Items Section */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>Items Ordered ({selectedOrder.order_items?.length || 0})</span>
                </span>
                <span className="text-gray-500 font-normal">
                  Total: <strong>₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</strong>
                </span>
              </div>

              {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-gray-50 overflow-hidden relative shrink-0 border border-gray-200 flex items-center justify-center">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{item.product_name}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {item.variant_name || 'Standard'} • Qty: {item.quantity} × ₹
                            {Number(item.price_at_purchase).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 shrink-0 ml-2">
                        ₹{Number(item.line_total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-2 text-center">
                  No individual item records found for this order.
                </p>
              )}
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
              {/* Delete Button */}
              <button
                type="button"
                onClick={() => setOrderToDelete(selectedOrder)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/orders/${selectedOrder.id}`}
                  className="px-3.5 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Open Full Page
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-pink hover:bg-[#d91668] rounded-xl shadow-pink transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═════════════════════════════════════════════════════════
          DELETE ORDER CONFIRMATION DIALOG
         ═════════════════════════════════════════════════════════ */}
      {mounted && orderToDelete && createPortal(
        <div
          onClick={() => !isDeleting && setOrderToDelete(null)}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4 animate-fade-in"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                Delete Order #{orderToDelete.order_number}?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This will permanently delete this order and all its items from Supabase. This action
                cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
