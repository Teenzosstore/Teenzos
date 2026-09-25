'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateDeliveryTracking, updateOrderStatus, updatePaymentStatus } from '@/actions/admin/orders'
import { assignShiprocketAwbToOrder, createShiprocketShipment, scheduleShiprocketPickupForOrder } from '@/actions/admin/shiprocket'
import { Check, Loader2, PackageCheck, Truck } from 'lucide-react'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

export function OrderStatusManager({ 
  orderId, 
  initialOrderStatus, 
  initialPaymentStatus,
  initialTracking,
  initialShiprocket,
}: { 
  orderId: string
  initialOrderStatus: string
  initialPaymentStatus: string
  initialTracking?: {
    courier_name?: string | null
    tracking_number?: string | null
    tracking_url?: string | null
    shipment_notes?: string | null
  }
  initialShiprocket?: {
    shiprocket_order_id?: string | null
    shiprocket_shipment_id?: string | null
    shiprocket_awb_code?: string | null
    shiprocket_pickup_token?: string | null
    shiprocket_pickup_scheduled_date?: string | null
  }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [courierId, setCourierId] = useState('')
  const [parcel, setParcel] = useState({
    length: '10',
    breadth: '10',
    height: '10',
    weight: '0.5',
  })
  const [tracking, setTracking] = useState({
    courier_name: initialTracking?.courier_name || '',
    tracking_number: initialTracking?.tracking_number || '',
    tracking_url: initialTracking?.tracking_url || '',
    shipment_notes: initialTracking?.shipment_notes || '',
  })

  const handleStatusChange = (type: 'order' | 'payment', value: string) => {
    setError(null)
    setSuccess(false)
    
    startTransition(async () => {
      const result = type === 'order' 
        ? await updateOrderStatus(orderId, value)
        : await updatePaymentStatus(orderId, value)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  const handleTrackingSave = () => {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateDeliveryTracking(orderId, tracking)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  const handleShiprocketCreate = () => {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await createShiprocketShipment(orderId, {
        length: Number(parcel.length),
        breadth: Number(parcel.breadth),
        height: Number(parcel.height),
        weight: Number(parcel.weight),
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  const handleShiprocketAwb = () => {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await assignShiprocketAwbToOrder(orderId, courierId)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  const handleShiprocketPickup = () => {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await scheduleShiprocketPickupForOrder(orderId)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink">Manage Status</h3>
        {isPending && <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />}
        {success && !isPending && <Check className="w-5 h-5 text-green-500" />}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-ink/80 mb-2">
          Order Status
        </label>
        <select
          disabled={isPending}
          defaultValue={initialOrderStatus}
          onChange={(e) => handleStatusChange('order', e.target.value)}
          className="w-full bg-cream-deep border border-cream-line rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all capitalize"
        >
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink/80 mb-2">
          Payment Status
        </label>
        <select
          disabled={isPending}
          defaultValue={initialPaymentStatus}
          onChange={(e) => handleStatusChange('payment', e.target.value)}
          className="w-full bg-cream-deep border border-cream-line rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all capitalize"
        >
          {PAYMENT_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-cream-line pt-5 space-y-4">
        <h4 className="text-sm font-bold text-ink uppercase tracking-wide">Delivery Tracking</h4>

        <div>
          <label className="block text-sm font-semibold text-ink/80 mb-2">
            Courier
          </label>
          <input
            disabled={isPending}
            value={tracking.courier_name}
            onChange={(event) => setTracking((prev) => ({ ...prev, courier_name: event.target.value }))}
            className="w-full bg-cream-deep border border-cream-line rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            placeholder="Delhivery, Blue Dart, Shiprocket..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink/80 mb-2">
            Tracking Number
          </label>
          <input
            disabled={isPending}
            value={tracking.tracking_number}
            onChange={(event) => setTracking((prev) => ({ ...prev, tracking_number: event.target.value }))}
            className="w-full bg-cream-deep border border-cream-line rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            placeholder="AWB / tracking id"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink/80 mb-2">
            Tracking URL
          </label>
          <input
            disabled={isPending}
            value={tracking.tracking_url}
            onChange={(event) => setTracking((prev) => ({ ...prev, tracking_url: event.target.value }))}
            className="w-full bg-cream-deep border border-cream-line rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink/80 mb-2">
            Shipment Notes
          </label>
          <textarea
            disabled={isPending}
            value={tracking.shipment_notes}
            onChange={(event) => setTracking((prev) => ({ ...prev, shipment_notes: event.target.value }))}
            className="min-h-24 w-full bg-cream-deep border border-cream-line rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            placeholder="Packed, handed to courier, delivery exception..."
          />
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleTrackingSave}
          className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          Save Tracking
        </button>
      </div>

      <div className="border-t border-cream-line pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-ink/50" />
          <h4 className="text-sm font-bold text-ink uppercase tracking-wide">Shiprocket</h4>
        </div>

        {(initialShiprocket?.shiprocket_order_id || initialShiprocket?.shiprocket_shipment_id || initialShiprocket?.shiprocket_awb_code) && (
          <div className="space-y-2 rounded-xl bg-cream-deep p-3 text-xs text-ink/70">
            {initialShiprocket?.shiprocket_order_id && (
              <p><span className="font-bold text-ink">Order:</span> {initialShiprocket.shiprocket_order_id}</p>
            )}
            {initialShiprocket?.shiprocket_shipment_id && (
              <p><span className="font-bold text-ink">Shipment:</span> {initialShiprocket.shiprocket_shipment_id}</p>
            )}
            {initialShiprocket?.shiprocket_awb_code && (
              <p><span className="font-bold text-ink">AWB:</span> {initialShiprocket.shiprocket_awb_code}</p>
            )}
            {initialShiprocket?.shiprocket_pickup_token && (
              <p><span className="font-bold text-ink">Pickup:</span> {initialShiprocket.shiprocket_pickup_token}</p>
            )}
            {initialShiprocket?.shiprocket_pickup_scheduled_date && (
              <p><span className="font-bold text-ink">Scheduled:</span> {initialShiprocket.shiprocket_pickup_scheduled_date}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Length cm</label>
            <input
              disabled={isPending}
              type="number"
              min="1"
              step="0.1"
              value={parcel.length}
              onChange={(event) => setParcel((prev) => ({ ...prev, length: event.target.value }))}
              className="w-full bg-cream-deep border border-cream-line rounded-xl px-3 py-2 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Breadth cm</label>
            <input
              disabled={isPending}
              type="number"
              min="1"
              step="0.1"
              value={parcel.breadth}
              onChange={(event) => setParcel((prev) => ({ ...prev, breadth: event.target.value }))}
              className="w-full bg-cream-deep border border-cream-line rounded-xl px-3 py-2 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Height cm</label>
            <input
              disabled={isPending}
              type="number"
              min="1"
              step="0.1"
              value={parcel.height}
              onChange={(event) => setParcel((prev) => ({ ...prev, height: event.target.value }))}
              className="w-full bg-cream-deep border border-cream-line rounded-xl px-3 py-2 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Weight kg</label>
            <input
              disabled={isPending}
              type="number"
              min="0.01"
              step="0.01"
              value={parcel.weight}
              onChange={(event) => setParcel((prev) => ({ ...prev, weight: event.target.value }))}
              className="w-full bg-cream-deep border border-cream-line rounded-xl px-3 py-2 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={isPending || Boolean(initialShiprocket?.shiprocket_shipment_id)}
          onClick={handleShiprocketCreate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          <PackageCheck className="h-4 w-4" />
          Create Shipment
        </button>

        <div>
          <label className="block text-sm font-semibold text-ink/80 mb-2">
            Courier ID
          </label>
          <input
            disabled={isPending || Boolean(initialShiprocket?.shiprocket_awb_code)}
            value={courierId}
            onChange={(event) => setCourierId(event.target.value)}
            className="w-full bg-cream-deep border border-cream-line rounded-xl px-4 py-2.5 text-sm font-medium text-ink/80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            placeholder="Optional if default courier is configured"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={isPending || !initialShiprocket?.shiprocket_shipment_id || Boolean(initialShiprocket?.shiprocket_awb_code)}
            onClick={handleShiprocketAwb}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            Assign AWB
          </button>
          <button
            type="button"
            disabled={isPending || !initialShiprocket?.shiprocket_awb_code || Boolean(initialShiprocket?.shiprocket_pickup_token)}
            onClick={handleShiprocketPickup}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            Schedule Pickup
          </button>
        </div>
      </div>
    </div>
  )
}