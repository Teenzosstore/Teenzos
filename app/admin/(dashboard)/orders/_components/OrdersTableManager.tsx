'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Search, X } from 'lucide-react'

type Profile = {
  full_name: string | null
  email: string | null
}

type Order = {
  id: string
  order_number: string
  created_at: string
  user_id: string | null
  total_amount: number
  payment_status: string
  order_status: string
  profiles: Profile | null
}

type OrdersTableManagerProps = {
  initialOrders: Order[]
}

export function OrdersTableManager({ initialOrders }: OrdersTableManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')

  const filteredOrders = (initialOrders || []).filter((order) => {
    // Search filter
    const matchesSearch = 
      (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.profiles?.full_name || 'Guest').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase())

    // Order status filter
    const matchesOrderStatus =
      orderStatusFilter === 'ALL' || (order.order_status || '').toLowerCase() === orderStatusFilter.toLowerCase()

    // Payment status filter
    const matchesPaymentStatus =
      paymentStatusFilter === 'ALL' || (order.payment_status || '').toLowerCase() === paymentStatusFilter.toLowerCase()

    return matchesSearch && matchesOrderStatus && matchesPaymentStatus
  })

  const clearFilters = () => {
    setSearchTerm('')
    setOrderStatusFilter('ALL')
    setPaymentStatusFilter('ALL')
  }

  const isFiltered = searchTerm !== '' || orderStatusFilter !== 'ALL' || paymentStatusFilter !== 'ALL'

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="bg-panel p-5 rounded-2xl shadow-sm border border-cream-line flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              type="text"
              placeholder="Search number, name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-cream-deep border border-cream-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all"
            />
          </div>

          {/* Order Status Select */}
          <div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-cream-deep border border-cream-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all text-ink/80"
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
              className="w-full px-3 py-2 bg-cream-deep border border-cream-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald transition-all text-ink/80"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {isFiltered && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-deep hover:bg-panel2 text-ink/60 rounded-lg text-xs font-semibold transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-cream-deep text-ink/60 uppercase tracking-wider text-xs border-b border-cream-line">
              <tr>
                <th className="px-6 py-4 font-semibold">Order</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Payment</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
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
                  <tr key={order.id} className="hover:bg-panel/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-ink">{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4 text-ink/60">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-ink">{order.profiles?.full_name || 'Guest'}</span>
                        <span className="text-xs text-ink/60">{order.profiles?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-ink">₹{order.total_amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          order.payment_status === 'paid'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : order.payment_status === 'failed'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : order.payment_status === 'refunded'
                            ? 'bg-cream-deep text-ink/80 border-cream-line'
                            : 'bg-orange-50 text-orange-700 border-orange-200' // pending
                        }`}
                      >
                        {(order.payment_status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          order.order_status === 'delivered'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : order.order_status === 'shipped'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : order.order_status === 'processing'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : order.order_status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200' // pending
                        }`}
                      >
                        {(order.order_status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center justify-center p-2 text-ink/40 hover:text-emerald hover:bg-emerald/5 rounded-xl transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
