'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { syncAllShiprocketOrders } from '@/actions/admin/shiprocket'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

export function SyncAllShiprocketButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ synced: number; failed: number; remaining: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSyncAll = () => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      const res = await syncAllShiprocketOrders()

      if (res.success === false) {
        setError(res.error || 'Failed to sync orders.')
        return
      }

      setResult({ synced: res.synced, failed: res.failed, remaining: res.remaining })
      router.refresh()
      setTimeout(() => setResult(null), 8000)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleSyncAll}
        disabled={isPending}
        title="Fetch the latest Shiprocket status for every in-transit order — catches anything the webhook missed"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-panel border border-cream-line text-ink text-sm font-semibold rounded-xl shadow-sm hover:bg-cream-deep transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Syncing…' : 'Sync with Shiprocket'}
      </button>

      {result && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Synced {result.synced} order{result.synced === 1 ? '' : 's'}
          {result.failed > 0 && `, ${result.failed} failed`}
          {result.remaining > 0 && ` (${result.remaining}+ more — click again)`}.
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}
