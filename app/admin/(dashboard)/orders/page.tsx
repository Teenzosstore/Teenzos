import { requireAdmin } from '@/lib/adminAuth'
import { OrdersTableManager } from './_components/OrdersTableManager'
import { SyncAllShiprocketButton } from './_components/SyncAllShiprocketButton'

export const metadata = {
  title: 'Orders | Admin Dashboard',
}

export default async function AdminOrdersPage() {
  const admin = await requireAdmin()
  const supabase = admin.ok ? admin.adminClient : null

  // Fetch all orders with user profile, delivery address, and order items
  const { data: orders } = supabase
    ? await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            phone
          ),
          addresses:address_id (
            id,
            full_name,
            phone,
            alternate_phone,
            address_line_1,
            address_line_2,
            city,
            state,
            postal_code
          ),
          order_items (
            id,
            product_id,
            variant_id,
            product_name,
            variant_name,
            price_at_purchase,
            quantity,
            line_total
          )
        `)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Hide unpaid Razorpay orders — a customer who abandons the payment modal
  // leaves one of these behind (see cancelPendingRazorpayOrder in
  // actions/checkout.ts), and it should stay invisible clutter rather than
  // show up as a real order. COD orders have no "paid" concept, so they
  // always show.
  const visibleOrders = ((orders || []) as any[]).filter((order) => {
    if (order.payment_method === 'COD' || order.payment_method === 'Cash on Delivery') return true
    return order.payment_status === 'paid'
  })

  let enrichedOrders = visibleOrders

  if (enrichedOrders.length > 0 && supabase) {
    const productIds = Array.from(
      new Set(
        enrichedOrders
          .flatMap((o: any) => o.order_items || [])
          .map((item: any) => item.product_id)
          .filter(Boolean)
      )
    )

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, featured_image_url')
        .in('id', productIds)

      const imageMap: Record<string, string> = {}
      products?.forEach((p: any) => {
        if (p.featured_image_url) imageMap[p.id] = p.featured_image_url
      })

      enrichedOrders = enrichedOrders.map((order: any) => ({
        ...order,
        order_items: (order.order_items || []).map((item: any) => ({
          ...item,
          image_url: (item.product_id && imageMap[item.product_id]) || '',
        })),
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Orders</h1>
          <p className="text-sm text-ink/60 mt-1">Manage and track all store orders.</p>
        </div>
        <SyncAllShiprocketButton />
      </div>

      <OrdersTableManager initialOrders={enrichedOrders} />
    </div>
  )
}
