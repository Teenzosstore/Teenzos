'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  updateDeliveryTracking,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
} from '@/actions/admin/orders'
import {
  assignShiprocketAwbToOrder,
  createShiprocketShipment,
  scheduleShiprocketPickupForOrder,
} from '@/actions/admin/shiprocket'
import {
  Check,
  Loader2,
  PackageCheck,
  Truck,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'

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
  const [showShiprocket, setShowShiprocket] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (showDeleteConfirm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showDeleteConfirm])

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
      const result =
        type === 'order'
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

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    const result = await deleteOrder(orderId)
    setIsDeleting(false)

    if (result.error) {
      setError(result.error)
      setShowDeleteConfirm(false)
    } else {
      router.push('/admin/orders')
      router.refresh()
    }
  }

  return (
    <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cream-line/70">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald" />
          <h3 className="text-sm font-bold text-ink">Manage Status & Dispatch</h3>
        </div>
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="w-4 h-4 text-pink animate-spin" />}
          {success && !isPending && <Check className="w-4 h-4 text-emerald" />}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Quick Status Selectors (Compact Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink/60 mb-1">
            Order Status
          </label>
          <select
            disabled={isPending}
            defaultValue={initialOrderStatus}
            onChange={(e) => handleStatusChange('order', e.target.value)}
            className="w-full bg-cream-deep border border-cream-line rounded-[5px] px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-pink transition-all capitalize"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink/60 mb-1">
            Payment Status
          </label>
          <select
            disabled={isPending}
            defaultValue={initialPaymentStatus}
            onChange={(e) => handleStatusChange('payment', e.target.value)}
            className="w-full bg-cream-deep border border-cream-line rounded-[5px] px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-pink transition-all capitalize"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courier & Tracking Inputs (Compact Row) */}
      <div className="space-y-2 pt-1 border-t border-cream-line/70">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-ink/60">
          Courier & Tracking (AWB)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">
          <input
            disabled={isPending}
            value={tracking.courier_name}
            onChange={(e) => setTracking((prev) => ({ ...prev, courier_name: e.target.value }))}
            className="w-full bg-cream-deep border border-cream-line rounded-[5px] px-3 py-1.5 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-pink"
            placeholder="Courier (e.g. Delhivery)"
          />
          <input
            disabled={isPending}
            value={tracking.tracking_number}
            onChange={(e) => setTracking((prev) => ({ ...prev, tracking_number: e.target.value }))}
            className="w-full bg-cream-deep border border-cream-line rounded-[5px] px-3 py-1.5 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-pink"
            placeholder="AWB / Tracking #"
          />
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleTrackingSave}
          className="w-full py-1.5 bg-black hover:bg-pink-light text-white rounded-[5px] text-xs font-bold transition-all shadow-2xs disabled:opacity-50 flex items-center justify-center gap-1.5 duration-200 cursor-pointer"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Courier & AWB'}
        </button>
      </div>

      {/* Optional Collapsible Shiprocket Section */}
      <div className="pt-1 border-t border-cream-line/70">
        <button
          type="button"
          onClick={() => setShowShiprocket(!showShiprocket)}
          className="w-full flex items-center justify-between text-xs font-bold text-ink/70 hover:text-ink py-1 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-orange-500" />
            <span>Shiprocket Automation (Optional)</span>
          </span>
          {showShiprocket ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showShiprocket && (
          <div className="mt-3 p-3 bg-cream-deep/60 rounded-xl border border-cream-line space-y-3 animate-fade-in text-xs">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div>
                <span className="text-[10px] text-ink/50 uppercase block">L (cm)</span>
                <input
                  value={parcel.length}
                  onChange={(e) => setParcel((p) => ({ ...p, length: e.target.value }))}
                  className="w-full p-1 bg-white border border-cream-line rounded text-xs text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-ink/50 uppercase block">B (cm)</span>
                <input
                  value={parcel.breadth}
                  onChange={(e) => setParcel((p) => ({ ...p, breadth: e.target.value }))}
                  className="w-full p-1 bg-white border border-cream-line rounded text-xs text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-ink/50 uppercase block">H (cm)</span>
                <input
                  value={parcel.height}
                  onChange={(e) => setParcel((p) => ({ ...p, height: e.target.value }))}
                  className="w-full p-1 bg-white border border-cream-line rounded text-xs text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-ink/50 uppercase block">Wt (kg)</span>
                <input
                  value={parcel.weight}
                  onChange={(e) => setParcel((p) => ({ ...p, weight: e.target.value }))}
                  className="w-full p-1 bg-white border border-cream-line rounded text-xs text-center"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending || Boolean(initialShiprocket?.shiprocket_order_id)}
                onClick={handleShiprocketCreate}
                className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-[11px] disabled:opacity-40"
              >
                Create Shipment
              </button>
              <button
                type="button"
                disabled={isPending || !initialShiprocket?.shiprocket_shipment_id || Boolean(initialShiprocket?.shiprocket_awb_code)}
                onClick={handleShiprocketAwb}
                className="flex-1 py-1.5 bg-ink hover:bg-black text-white rounded-lg font-bold text-[11px] disabled:opacity-40"
              >
                Assign AWB
              </button>
              <button
                type="button"
                disabled={isPending || !initialShiprocket?.shiprocket_awb_code || Boolean(initialShiprocket?.shiprocket_pickup_token)}
                onClick={handleShiprocketPickup}
                className="flex-1 py-1.5 bg-ink hover:bg-black text-white rounded-lg font-bold text-[11px] disabled:opacity-40"
              >
                Schedule Pickup
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {mounted && showDeleteConfirm && createPortal(
        <div
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-center space-y-3.5 animate-fade-in"
          >
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">Delete this order?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This will permanently delete this order and all items from Supabase. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}