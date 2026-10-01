'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Search,
  X,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { deleteOrder } from '@/actions/admin/orders'

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
  shiprocket_order_id?: string | null
  shiprocket_shipment_id?: string | null
  shiprocket_awb_code?: string | null
  shiprocket_pickup_token?: string | null
  shiprocket_pickup_scheduled_date?: string | null
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

  // Order Deletion State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pick up fresh server data after router.refresh() (e.g. returning from an
  // order's detail page, or after a delete).
  useEffect(() => {
    setOrders(initialOrders || [])
  }, [initialOrders])

  // Lock body scroll while the delete dialog is open
  useEffect(() => {
    if (orderToDelete) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [orderToDelete])

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
          className={`fixed bottom-6 right-6 z-[110000] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-bold text-white animate-fade-in ${
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
              className="w-full pl-10 pr-4 py-2.5 bg-cream-deep border border-cream-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all"
            />
          </div>

          {/* Order Status Select */}
          <div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-cream-deep border border-cream-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all text-ink/80"
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
              className="w-full px-3 py-2.5 bg-cream-deep border border-cream-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all text-ink/80"
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
        <div className="flex items-center justify-between pt-1 border-t border-cream-line/60 text-sm">
          <span className="text-ink/60 font-medium">
            Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
          </span>

          {isFiltered && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1 bg-cream-deep hover:bg-panel2 text-ink/60 rounded-lg text-sm font-semibold transition-colors"
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
          <table className="w-full text-left text-base whitespace-nowrap">
            <thead className="bg-cream-deep text-ink/60 uppercase tracking-wider text-sm border-b border-cream-line">
              <tr>
                <th className="px-5 py-4 font-semibold">Order</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
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
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">#{order.order_number}</span>
                        {order.courier_name && (
                          <span className="text-xs bg-cyan-50 text-[#218D98] border border-cyan-200/80 px-2 py-0.5 rounded font-semibold hidden sm:inline">
                            {order.courier_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-ink/60">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-ink">
                          {order.profiles?.full_name || order.addresses?.full_name || 'Guest'}
                        </span>
                        <span className="text-xs text-ink/50">
                          {order.profiles?.email || order.addresses?.phone || 'No email'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-sm text-ink">
                        ₹{Number(order.total_amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
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
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
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
                      className="px-5 py-4 text-right space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Order details open on their own page */}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center justify-center p-2 text-ink/60 hover:text-pink hover:bg-pink-50 rounded-xl transition-colors"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
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
