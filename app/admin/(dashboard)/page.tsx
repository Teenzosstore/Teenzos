import { requireAdmin } from '@/lib/adminAuth'
import {
  ShoppingCart,
  Users,
  Package,
  IndianRupee,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Dashboard | TeenZos Admin',
}

type RecentOrder = {
  id: string
  order_number: string | null
  total_amount: number | string | null
  order_status: string | null
  payment_status: string | null
  created_at: string | null
}

type AdminStats = {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  recentOrders: RecentOrder[]
  loadError: boolean
  errorMessage?: string
}

function emptyStats(loadError: boolean, errorMessage?: string): AdminStats {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    recentOrders: [],
    loadError,
    errorMessage,
  }
}

function formatOrderDate(value: string | null) {
  if (!value) return 'Unknown'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function getStats(): Promise<AdminStats> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) {
      return emptyStats(false)
    }
    const supabase = admin.adminClient

    const [ordersRes, customersRes, productsRes, recentOrdersRes] =
      await Promise.all([
        supabase
          .from('orders')
          .select('id, total_amount', { count: 'exact', head: false }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'customer'),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('id, order_number, total_amount, order_status, payment_status, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

    const queryErrors = [
      ordersRes.error,
      customersRes.error,
      productsRes.error,
      recentOrdersRes.error,
    ].filter(Boolean)

    if (queryErrors.length > 0) {
      console.error('Admin dashboard stats failed:', queryErrors)
      const isMissingTables = queryErrors.some(
        (e) => e?.code === 'PGRST205' || e?.message?.includes('schema cache')
      )
      const errorMsg = isMissingTables
        ? 'Database tables are not initialized in Supabase yet. Please execute sql/schema.sql in the Supabase SQL Editor.'
        : queryErrors[0]?.message || 'Dashboard stats are temporarily unavailable.'

      return emptyStats(true, errorMsg)
    }

    const totalOrders = ordersRes.count || 0
    const totalRevenue =
      ordersRes.data?.reduce(
        (sum, order) => sum + (Number(order.total_amount) || 0),
        0
      ) || 0
    const totalCustomers = customersRes.count || 0
    const totalProducts = productsRes.count || 0
    const recentOrders = recentOrdersRes.data || []

    return { totalOrders, totalRevenue, totalCustomers, totalProducts, recentOrders, loadError: false }
  } catch (error: any) {
    console.error('Admin dashboard failed to load stats:', error)
    return emptyStats(true, error?.message || 'Unexpected error while loading dashboard stats.')
  }
}

const statusBadgeStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
  processing: 'bg-sky-50 text-sky-700 border-sky-200/80',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200/80',
}

export default async function AdminDashboardPage() {
  const { totalOrders, totalRevenue, totalCustomers, totalProducts, recentOrders, loadError, errorMessage } =
    await getStats()

  const statCards = [
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      iconBg: 'bg-[#FFE1ED] text-[#F72585]',
      borderHover: 'hover:border-[#F72585]/40',
      badge: 'Live',
    },
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString('en-IN'),
      icon: ShoppingCart,
      iconBg: 'bg-[#DDF6F8] text-[#36B8C5]',
      borderHover: 'hover:border-[#36B8C5]/40',
      badge: 'Store',
    },
    {
      label: 'Customers',
      value: totalCustomers.toLocaleString('en-IN'),
      icon: Users,
      iconBg: 'bg-[#FFF0E3] text-[#F47B20]',
      borderHover: 'hover:border-[#F47B20]/40',
      badge: 'Verified',
    },
    {
      label: 'Active Products',
      value: totalProducts.toLocaleString('en-IN'),
      icon: Package,
      iconBg: 'bg-[#F3E8FF] text-[#9333EA]',
      borderHover: 'hover:border-[#9333EA]/40',
      badge: 'Catalog',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-7 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B0D0E] tracking-tight font-sans">
              Overview
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE1ED] text-[#F72585] text-xs font-semibold">
              <Sparkles className="w-3 h-3 text-[#F72585]" />
              TeenZos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7073] mt-1 font-sans">
            Real-time management metrics and storefront activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-semibold text-[#0B0D0E] hover:border-[#F72585] hover:text-[#F72585] transition-all shadow-xs"
          >
            <Package className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F72585] hover:bg-[#D91668] text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-[#F72585]/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>View Orders</span>
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-amber-300/70 bg-amber-50/90 p-4 sm:p-5 text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1 sm:mt-0 animate-ping" />
            <div>
              <p className="font-semibold text-amber-950">
                Dashboard Stats Unavailable
              </p>
              <p className="text-xs sm:text-sm text-amber-800/90 mt-0.5">
                {errorMessage || 'Check Supabase connection or permissions.'}
              </p>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard/project/ywsybtefdtgnzzxnxfvy/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs"
          >
            <span>Open Supabase SQL Editor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 group ${card.borderHover}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shadow-xs transition-transform group-hover:scale-105`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 group-hover:text-[#0B0D0E] transition-colors uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                  {card.badge}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0B0D0E] tracking-tight font-sans">
                {card.value}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs sm:text-sm font-medium text-[#6B7073] font-sans">
                  {card.label}
                </p>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#F72585] transition-colors" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFE1ED] text-[#F72585] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0B0D0E] font-sans">
                Recent Orders
              </h2>
              <p className="text-xs text-[#6B7073]">Latest transactions placed on your store</p>
            </div>
          </div>

          <Link
            href="/admin/orders"
            className="text-xs sm:text-sm font-semibold text-[#F72585] hover:text-[#D91668] transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-[#0B0D0E] font-semibold text-base">No orders yet</p>
            <p className="text-[#6B7073] text-xs sm:text-sm mt-1 max-w-xs mx-auto">
              Customer orders will appear here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  <th className="text-xs font-semibold text-[#6B7073] uppercase tracking-wider px-5 sm:px-6 py-3.5 font-sans">
                    Order ID
                  </th>
                  <th className="text-xs font-semibold text-[#6B7073] uppercase tracking-wider px-5 sm:px-6 py-3.5 font-sans">
                    Amount
                  </th>
                  <th className="text-xs font-semibold text-[#6B7073] uppercase tracking-wider px-5 sm:px-6 py-3.5 font-sans">
                    Order Status
                  </th>
                  <th className="text-xs font-semibold text-[#6B7073] uppercase tracking-wider px-5 sm:px-6 py-3.5 font-sans">
                    Payment
                  </th>
                  <th className="text-xs font-semibold text-[#6B7073] uppercase tracking-wider px-5 sm:px-6 py-3.5 font-sans">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-5 sm:px-6 py-4 text-sm font-semibold text-[#0B0D0E]">
                      <span className="text-[#F72585]">#</span>
                      {order.order_number || order.id.slice(0, 8)}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-sm font-bold text-[#0B0D0E]">
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 sm:px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                          statusBadgeStyles[order.order_status?.toLowerCase() || ''] ||
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {order.order_status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                          order.payment_status?.toLowerCase() === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-amber-50 text-amber-700 border-amber-200/80'
                        }`}
                      >
                        {order.payment_status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-xs sm:text-sm text-[#6B7073]">
                      {formatOrderDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
