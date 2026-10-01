'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { updateOrderStatus, updatePaymentStatus } from '@/actions/admin/orders'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

export function OrderStatusManager({
  orderId,
  initialOrderStatus,
  initialPaymentStatus,
}: {
  orderId: string
  initialOrderStatus: string
  initialPaymentStatus: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  const selectClass =
    'w-full bg-cream-deep border border-cream-line rounded-xl px-3 py-2 text-sm font-medium text-ink focus:outline-none focus:border-pink transition-all capitalize disabled:opacity-50'

  return (
    <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">Manage Status</h3>
        <div className="flex items-center gap-1.5">
          {isPending && <Loader2 className="w-4 h-4 text-pink animate-spin" />}
          {success && !isPending && <Check className="w-4 h-4 text-emerald-600" />}
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-ink/60 uppercase tracking-wider mb-1.5">
          Order Status
        </label>
        <select
          disabled={isPending}
          defaultValue={initialOrderStatus}
          onChange={(e) => handleStatusChange('order', e.target.value)}
          className={selectClass}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink/60 uppercase tracking-wider mb-1.5">
          Payment Status
        </label>
        <select
          disabled={isPending}
          defaultValue={initialPaymentStatus}
          onChange={(e) => handleStatusChange('payment', e.target.value)}
          className={selectClass}
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
