import { requireAdmin } from '@/lib/adminAuth'
import {
  ShoppingCart,
  Users,
  Package,
  IndianRupee,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
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
}

function emptyStats(loadError: boolean): AdminStats {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    recentOrders: [],
    loadError,
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

async function getStats() {
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
          .limit(5),
      ])

    const queryErrors = [
      ordersRes.error,
      customersRes.error,
      productsRes.error,
      recentOrdersRes.error,
    ].filter(Boolean)

    if (queryErrors.length > 0) {
      console.error('Admin dashboard stats failed:', queryErrors)
      return emptyStats(true)
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
  } catch (error) {
    console.error('Admin dashboard failed to load stats:', error)
    return emptyStats(true)
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function AdminDashboardPage() {
  const { totalOrders, totalRevenue, totalCustomers, totalProducts, recentOrders, loadError } =
    await getStats()

  const statCards = [
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      gradient: 'from-gold to-gold-light',
      shadowColor: 'shadow-gold/20',
    },
    {
      label: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      gradient: 'from-gold to-gold-light',
      shadowColor: 'shadow-gold/20',
    },
    {
      label: 'Customers',
      value: totalCustomers.toString(),
      icon: Users,
      gradient: 'from-gold to-gold-light',
      shadowColor: 'shadow-gold/20',
    },
    {
      label: 'Products',
      value: totalProducts.toString(),
      icon: Package,
      gradient: 'from-gold to-gold-light',
      shadowColor: 'shadow-gold/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Overview</h1>
        <p className="text-ink/60 text-sm mt-0.5">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-100/10 px-4 py-3 text-sm text-ink/80">
          Dashboard stats are temporarily unavailable. Check the production Supabase env vars and database tables if this keeps happening.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-panel rounded-xl border border-cream-line p-5 hover:shadow-lg hover:shadow-black/40 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md ${card.shadowColor}`}
                >
                  <Icon className="w-5 h-5 text-black" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-ink/50 group-hover:text-ink/40 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-ink">{card.value}</p>
              <p className="text-sm text-ink/60 mt-0.5">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-panel rounded-xl border border-cream-line overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-ink/40" />
            <h2 className="text-base font-semibold text-ink">
              Recent Orders
            </h2>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-ink/50 mx-auto mb-3" />
            <p className="text-ink/60 text-sm">No orders yet</p>
            <p className="text-ink/40 text-xs mt-1">
              Orders will appear here once customers start placing them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-panel/50">
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Order
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Payment
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-line">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-panel/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-ink">
                      #{order.order_number || order.id}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-ink/80">
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${
                          statusColors[order.order_status || ''] ||
                          'bg-cream-deep text-ink/80'
                        }`}
                      >
                        {order.order_status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.payment_status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-ink/60">
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
