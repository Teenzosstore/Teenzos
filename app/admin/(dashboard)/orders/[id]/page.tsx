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
  Truck,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import { OrderStatusManager } from '../_components/OrderStatusManager'

export const metadata = {
  title: 'Order Details | Admin Dashboard',
}

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const orderId = resolvedParams.id
  const admin = await requireAdmin()
  if (admin.ok === false) {
    notFound()
  }
  const supabase = admin.adminClient

  // Fetch Order Details with customer, address, and items
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

  if (orderError || !order) {
    notFound()
  }

  // Fetch product images for order items
  const productIds = Array.from(
    new Set((order.order_items || []).map((item: any) => item.product_id).filter(Boolean))
  )

  let productsById: Record<string, { image_url: string; is_active: boolean }> = {}
  if (productIds.length > 0) {
    const { data: productsData } = await supabase
      .from('products')
      .select('id, is_active, featured_image_url, product_images ( image_url )')
      .in('id', productIds)

    productsById = (productsData || []).reduce((acc: any, p: any) => {
      acc[p.id] = {
        image_url: p.product_images?.[0]?.image_url || p.featured_image_url || null,
        is_active: p.is_active,
      }
      return acc
    }, {})
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 1. COMPACT HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-panel border border-cream-line rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 bg-cream-deep hover:bg-panel2 border border-cream-line text-ink/70 hover:text-ink rounded-xl transition-colors"
            title="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-ink">
                Order #{order.order_number}
              </h1>
              {/* Order Status Badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  order.order_status === 'delivered'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : order.order_status === 'shipped'
                    ? 'bg-cyan-50 text-[#218D98] border border-cyan-200'
                    : order.order_status === 'cancelled'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {order.order_status}
              </span>
              {/* Payment Status Badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  order.payment_status === 'paid'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {order.payment_status} ({order.payment_method || 'Online'})
              </span>
            </div>
            <p className="text-xs text-ink/50 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-ink/40" />
              <span>
                Placed on{' '}
                {new Date(order.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>
        </div>

        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-ink/60 hover:text-ink px-3 py-1.5 rounded-xl border border-cream-line bg-cream-deep hover:bg-panel2 transition-colors self-start sm:self-auto"
        >
          ← All Orders
        </Link>
      </div>

      {/* 2. ESSENTIAL 3-COLUMN COMPACT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Customer & Delivery Address */}
        <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-ink font-bold pb-2 border-b border-cream-line/70">
            <User className="w-4 h-4 text-pink" />
            <span>Customer & Address</span>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-ink">
              {order.profiles?.full_name || order.addresses?.full_name || 'Guest Customer'}
            </p>
            <p className="text-ink/60">{order.profiles?.email || 'No email provided'}</p>
            {(order.profiles?.phone || order.addresses?.phone) && (
              <p className="text-ink/70 font-medium">
                Phone: {order.profiles?.phone || order.addresses?.phone}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-cream-line/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block mb-0.5">
              Delivery Address:
            </span>
            {order.addresses ? (
              <p className="text-ink/70 leading-relaxed">
                {order.addresses.address_line_1}
                {order.addresses.address_line_2 && `, ${order.addresses.address_line_2}`}
                <br />
                {order.addresses.city}, {order.addresses.state} - {order.addresses.postal_code}
                {order.addresses.alternate_phone && (
                  <span className="block text-[11px] text-ink/50 mt-1">
                    Alt Phone: {order.addresses.alternate_phone}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-ink/40 italic">No delivery address saved.</p>
            )}
          </div>
        </div>

        {/* Card 2: Financial Summary & Tracking */}
        <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-ink font-bold pb-2 border-b border-cream-line/70">
            <CreditCard className="w-4 h-4 text-emerald" />
            <span>Payment & Financials</span>
          </div>

          <div className="space-y-1.5 text-ink/70">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-ink">
                ₹{Number(order.subtotal || order.total_amount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee:</span>
              <span className="font-semibold text-emerald">
                {Number(order.shipping_cost) === 0 ? 'Free' : `₹${order.shipping_cost}`}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-cream-line/70 text-sm">
              <span className="font-bold text-ink">Total Amount:</span>
              <span className="font-black text-pink">
                ₹{Number(order.total_amount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Courier & AWB Display if present */}
          {(order.courier_name || order.tracking_number) && (
            <div className="pt-2 border-t border-cream-line/70 text-[11px] bg-cream-deep/60 p-2.5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-ink font-bold">
                <Truck className="w-3.5 h-3.5 text-[#36B8C5]" />
                <span>Active Shipment Tracking</span>
              </div>
              <div className="text-ink/70 space-y-0.5">
                {order.courier_name && (
                  <p>
                    Courier: <strong className="text-ink">{order.courier_name}</strong>
                  </p>
                )}
                {order.tracking_number && (
                  <p>
                    AWB Code:{' '}
                    <strong className="text-ink font-mono">{order.tracking_number}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Live Status & Dispatch Manager */}
        <div>
          <OrderStatusManager
            orderId={order.id}
            initialOrderStatus={order.order_status}
            initialPaymentStatus={order.payment_status}
            initialTracking={{
              courier_name: order.courier_name,
              tracking_number: order.tracking_number,
              tracking_url: order.tracking_url,
              shipment_notes: order.shipment_notes,
            }}
            initialShiprocket={{
              shiprocket_order_id: order.shiprocket_order_id,
              shiprocket_shipment_id: order.shiprocket_shipment_id,
              shiprocket_awb_code: order.shiprocket_awb_code,
              shiprocket_pickup_token: order.shiprocket_pickup_token,
              shiprocket_pickup_scheduled_date: order.shiprocket_pickup_scheduled_date,
            }}
          />
        </div>
      </div>

      {/* 3. ORDERED ITEMS TABLE (Compact, Clean & Responsive) */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-cream-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-ink/50" />
            <h3 className="text-sm font-bold text-ink">
              Items Ordered ({order.order_items?.length || 0})
            </h3>
          </div>
          <span className="text-xs text-ink/60 font-semibold">
            Order Total: <strong>₹{Number(order.total_amount).toLocaleString('en-IN')}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-cream-deep text-ink/50 uppercase tracking-wider text-[10px] border-b border-cream-line">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Product</th>
                <th className="px-4 py-2.5 font-semibold">Size / Variant</th>
                <th className="px-4 py-2.5 font-semibold">Unit Price</th>
                <th className="px-4 py-2.5 font-semibold">Qty</th>
                <th className="px-4 py-2.5 font-semibold text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-line">
              {order.order_items?.map((item: any) => {
                const product = item.product_id ? productsById[item.product_id] : null
                const href = product?.is_active ? `/shop/${item.product_id}` : null

                const thumbnail = (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-cream-line bg-cream-deep">
                    {product?.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink/40 text-[9px] font-bold">
                        IMG
                      </div>
                    )}
                  </div>
                )

                return (
                  <tr key={item.id} className="hover:bg-panel2/50 transition-colors">
                    <td className="px-4 py-3">
                      {href ? (
                        <Link
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 group"
                        >
                          {thumbnail}
                          <div className="min-w-0">
                            <span className="font-semibold text-ink group-hover:text-pink transition-colors truncate block max-w-xs">
                              {item.product_name}
                            </span>
                            <span className="text-[10px] text-pink font-semibold flex items-center gap-1">
                              View in Store <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          {thumbnail}
                          <span className="font-semibold text-ink truncate max-w-xs">
                            {item.product_name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      <span className="bg-cream-deep px-2 py-0.5 rounded-md font-medium text-[11px]">
                        {item.variant_name || 'Standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/70 font-medium">
                      ₹{Number(item.price_at_purchase).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-ink/80 font-bold">{item.quantity}</td>
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
  )
}
