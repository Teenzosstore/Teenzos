import { requireAdmin } from '@/lib/adminAuth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, User, MapPin, Package, CreditCard } from 'lucide-react'
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

  // Fetch Order Details
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
        city,
        state,
        postal_code
      ),
      order_items (*)
    `)
    .eq('id', orderId)
    .single()

  if (orderError) {
    console.error('Failed to load order', orderId, orderError)
  }

  if (!order) {
    notFound()
  }

  // order_items.product_id has no DB foreign key to products (some legacy/mock
  // rows may not resolve), so look products up separately rather than embedding.
  const productIds = Array.from(new Set((order.order_items || []).map((item: any) => item.product_id).filter(Boolean)))

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/orders"
          className="p-2 bg-panel border border-cream-line text-ink/60 rounded-xl hover:bg-panel2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">Order {order.order_number}</h1>
          <p className="text-sm text-ink/60 mt-1">
            Placed on {new Date(order.created_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-ink/40" />
                Customer
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-ink">{order.profiles?.full_name || 'Guest'}</p>
                <p className="text-ink/60">{order.profiles?.email}</p>
                {order.profiles?.phone && <p className="text-ink/60">{order.profiles.phone}</p>}
              </div>
            </div>

            <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-ink/40" />
                Shipping Address
              </h3>
              {order.addresses ? (
                <div className="space-y-1 text-sm text-ink/60">
                  <p className="font-medium text-ink mb-1">{order.addresses.full_name}</p>
                  <p>{order.addresses.address_line_1}</p>
                  <p>{order.addresses.city}, {order.addresses.state} {order.addresses.postal_code}</p>
                  <p className="mt-2 pt-2 border-t border-cream-line">Phone: {order.addresses.phone}</p>
                  {order.addresses.alternate_phone && (
                    <p>Alternate: {order.addresses.alternate_phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink/60 italic">No address details available.</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-panel rounded-2xl shadow-sm border border-cream-line overflow-hidden">
            <div className="p-6 border-b border-cream-line flex items-center gap-2">
              <Package className="w-5 h-5 text-ink/40" />
              <h3 className="text-lg font-bold text-ink">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-cream-deep text-ink/60 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Variant</th>
                    <th className="px-6 py-4 font-semibold">Product ID</th>
                    <th className="px-6 py-4 font-semibold">Unit Price</th>
                    <th className="px-6 py-4 font-semibold">Qty</th>
                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-line">
                  {order.order_items?.map((item: any) => {
                    const product = item.product_id ? productsById[item.product_id] : null
                    const href = product?.is_active ? `/shop/${item.product_id}` : null

                    const thumbnail = (
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 border border-cream-line bg-cream-deep">
                        {product?.image_url ? (
                          <Image src={product.image_url} alt={item.product_name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink/50 text-[10px] font-medium">
                            IMG
                          </div>
                        )}
                      </div>
                    )

                    return (
                      <tr key={item.id} className="hover:bg-panel/50 transition-colors">
                        <td className="px-6 py-4">
                          {href ? (
                            <Link href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                              {thumbnail}
                              <span className="font-medium text-ink group-hover:text-orange-600 transition-colors">
                                {item.product_name}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3">
                              {thumbnail}
                              <div>
                                <span className="font-medium text-ink">{item.product_name}</span>
                                <span className="block text-[11px] text-ink/40 font-medium">
                                  {product ? 'Inactive — not viewable on site' : 'Product no longer available'}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-ink/60">{item.variant_name}</td>
                        <td className="px-6 py-4 text-ink/40 text-xs">{item.product_id || '—'}</td>
                        <td className="px-6 py-4 text-ink/60">₹{item.price_at_purchase}</td>
                        <td className="px-6 py-4 text-ink/60">{item.quantity}</td>
                        <td className="px-6 py-4 font-medium text-ink text-right">₹{item.line_total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Status & Summary */}
        <div className="space-y-6">
          
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

          <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6">
            <h3 className="text-lg font-bold text-ink flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-ink/40" />
              Payment Summary
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span>
                <span className="font-medium text-ink">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Shipping</span>
                {order.shipping_cost === 0 ? (
                  <span className="font-medium text-green-600">Free</span>
                ) : (
                  <span className="font-medium text-ink">₹{order.shipping_cost}</span>
                )}
              </div>
              <div className="pt-3 border-t border-cream-line flex justify-between items-center">
                <span className="font-bold text-ink">Total</span>
                <span className="text-xl font-bold text-orange-600">₹{order.total_amount}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-cream-line">
              <p className="text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2">Payment Method</p>
              <p className="text-sm font-medium text-ink">{order.payment_method}</p>
            </div>



            {(order.courier_name || order.tracking_number || order.tracking_url || order.shipment_notes) && (
              <div className="mt-6 pt-6 border-t border-cream-line space-y-3">
                <p className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Delivery Tracking</p>
                {order.courier_name && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-ink/60">Courier</span>
                    <span className="font-medium text-ink text-right">{order.courier_name}</span>
                  </div>
                )}
                {order.tracking_number && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-ink/60">Tracking No.</span>
                    <span className="font-medium text-ink text-right">{order.tracking_number}</span>
                  </div>
                )}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-sm font-bold text-orange-600 hover:text-orange-700"
                  >
                    Open tracking link
                  </a>
                )}
                {order.shipment_notes && (
                  <p className="rounded-xl bg-cream-deep p-3 text-sm text-ink/70">{order.shipment_notes}</p>
                )}
              </div>
            )}

            {(order.shiprocket_order_id || order.shiprocket_shipment_id || order.shiprocket_awb_code || order.shiprocket_pickup_token) && (
              <div className="mt-6 pt-6 border-t border-cream-line space-y-3">
                <p className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Shiprocket Details</p>
                {order.shiprocket_order_id && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-ink/60">Order ID</span>
                    <span className="font-medium text-ink text-right">{order.shiprocket_order_id}</span>
                  </div>
                )}
                {order.shiprocket_shipment_id && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-ink/60">Shipment ID</span>
                    <span className="font-medium text-ink text-right">{order.shiprocket_shipment_id}</span>
                  </div>
                )}
                {order.shiprocket_awb_code && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-ink/60">AWB</span>
                    <span className="font-medium text-ink text-right">{order.shiprocket_awb_code}</span>
                  </div>
                )}
                {order.shiprocket_pickup_token && (
                  <p className="rounded-xl bg-cream-deep p-3 text-sm text-ink/70">{order.shiprocket_pickup_token}</p>
                )}
              </div>
            )}
          </div>

          {/* Timeline Section */}
          <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6">
            <h3 className="text-lg font-bold text-ink mb-6">Timeline</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">Order Placed</span>
                <span className="font-medium text-ink">
                  {new Date(order.created_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-ink/60">Paid</span>
                  <span className="font-medium text-ink">
                    {new Date(order.paid_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {order.shipped_at && (
                <div className="flex justify-between">
                  <span className="text-ink/60">Shipped</span>
                  <span className="font-medium text-ink">
                    {new Date(order.shipped_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-ink/60">Delivered</span>
                  <span className="font-medium text-ink">
                    {new Date(order.delivered_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {order.cancelled_at && (
                <div className="flex justify-between text-red-600">
                  <span>Cancelled</span>
                  <span className="font-medium">
                    {new Date(order.cancelled_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
