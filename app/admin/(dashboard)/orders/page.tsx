import { requireAdmin } from '@/lib/adminAuth'
import { OrdersTableManager } from './_components/OrdersTableManager'

export const metadata = {
  title: 'Orders | Admin Dashboard',
}

export default async function AdminOrdersPage() {
  const admin = await requireAdmin()
  const supabase = admin.ok ? admin.adminClient : null

  // Fetch all orders with user profile info
  const { data: orders } = supabase
    ? await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <p className="text-sm text-ink/60 mt-1">Manage and track all store orders.</p>
      </div>

      <OrdersTableManager initialOrders={orders || []} />
    </div>
  )
}
