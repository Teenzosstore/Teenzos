'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createShiprocketShipment, syncShiprocketStatus } from '@/actions/admin/shiprocket'
import {
  SHIPROCKET_DEFAULT_PARCEL_CM,
  SHIPROCKET_NEW_ORDERS_URL,
  estimateParcelWeightKg,
} from '@/lib/shiprocket-constants'
import { CheckCircle2, ExternalLink, Loader2, MapPin, RefreshCw, Truck } from 'lucide-react'

type ScanEvent = {
  date: string | null
  status: string | null
  activity: string | null
  location: string | null
}

type Props = {
  orderId: string
  shiprocketOrderId: string | null
  shiprocketShipmentId?: string | null
  awbCode: string | null
  courierName: string | null
  trackingUrl: string | null
  pickupToken?: string | null
  pickupScheduledDate?: string | null
  paymentMethod: string | null
  paymentStatus: string
  // Total units in the order — used to pre-fill a sensible parcel weight.
  itemUnits?: number
}

// Same flow as the Hijabistaa store: "Ship via Shiprocket" pushes the order to
// Shiprocket only. The admin then clicks "Ship Now" on that order inside
// Shiprocket's own dashboard to pick a courier; the AWB and live status come
// back here via the webhook, or the refresh button / auto-sync on open.
export function ShiprocketPanel({
  orderId,
  shiprocketOrderId,
  awbCode,
  courierName,
  trackingUrl,
  paymentMethod,
  paymentStatus,
  itemUnits = 1,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSyncing, startSyncTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  // Pre-filled with the t-shirt defaults; the admin edits them per order.
  const [parcel, setParcel] = useState({
    length: String(SHIPROCKET_DEFAULT_PARCEL_CM.length),
    breadth: String(SHIPROCKET_DEFAULT_PARCEL_CM.breadth),
    height: String(SHIPROCKET_DEFAULT_PARCEL_CM.height),
    weight: String(estimateParcelWeightKg(itemUnits)),
  })
  const [status, setStatus] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [scans, setScans] = useState<ScanEvent[]>([])

  const isPrepaid = /online|prepaid/i.test(paymentMethod || '')
  const blockedUnpaid = isPrepaid && paymentStatus !== 'paid'

  const handleCreateShipment = () => {
    setError(null)
    setSyncMessage(null)
    startTransition(async () => {
      const values = {
        length: parseFloat(parcel.length),
        breadth: parseFloat(parcel.breadth),
        height: parseFloat(parcel.height),
        weight: parseFloat(parcel.weight),
      }
      if (Object.values(values).some((v) => !Number.isFinite(v) || v <= 0)) {
        setError('Enter a valid length, breadth, height (cm) and weight (kg) — all greater than 0.')
        return
      }

      const result = await createShiprocketShipment(orderId, values)
      if (result.success === false) {
        setError(result.error || 'Failed to create Shiprocket shipment.')
        return
      }
      router.refresh()
    })
  }

  // `silent` is used for the auto-sync on open: it updates the panel without
  // flashing an error if Shiprocket is slow at that moment. A manual click
  // always shows a clear success/error result.
  const handleSync = (silent = false) => {
    if (!silent) {
      setError(null)
      setSyncMessage(null)
    }
    startSyncTransition(async () => {
      const result = await syncShiprocketStatus(orderId)
      if (result.success === false) {
        if (!silent) setError(result.error)
        return
      }
      setStatus(result.shiprocketStatus)
      setCurrentLocation(result.currentLocation)
      setScans(result.scans)
      if (!silent) setSyncMessage('Status synced from Shiprocket.')
      router.refresh()
    })
  }

  // Auto-sync once when the panel opens so it reflects Shiprocket's live
  // status without the admin needing to click refresh.
  useEffect(() => {
    if (shiprocketOrderId) handleSync(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-cream-line/70">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
          <Truck className="w-4 h-4 text-ink/40" />
          Shipping (Shiprocket)
        </h3>
        <div className="flex items-center gap-2">
          {shiprocketOrderId && (
            <button
              type="button"
              onClick={() => handleSync()}
              disabled={isSyncing}
              title="Fetch the latest status directly from Shiprocket"
              className="p-1.5 text-ink/40 hover:text-pink hover:bg-pink/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
          {isPending && <Loader2 className="w-4 h-4 text-pink animate-spin" />}
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-medium">
          {error}
        </div>
      )}
      {syncMessage && (
        <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 font-medium">
          {syncMessage}
        </div>
      )}

      {!shiprocketOrderId ? (
        <>
          <p className="text-xs text-ink/60">
            Pushes this order to Shiprocket. You&apos;ll then assign a courier and confirm pickup yourself from the
            Shiprocket dashboard.
          </p>
          {blockedUnpaid && (
            <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              This is an online-payment order that isn&apos;t paid yet — a shipment can only be created after payment.
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold text-ink/80 mb-2">Parcel size &amp; weight</label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ['length', 'Length (cm)'],
                  ['breadth', 'Breadth (cm)'],
                  ['height', 'Height (cm)'],
                  ['weight', 'Weight (kg)'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <span className="block text-[10px] text-ink/50 mb-1 leading-tight">{label}</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={parcel[key]}
                    onChange={(e) => setParcel((p) => ({ ...p, [key]: e.target.value }))}
                    disabled={isPending}
                    className="w-full bg-cream-deep border border-cream-line rounded-lg px-2 py-2 text-sm font-medium text-ink text-center focus:outline-none focus:border-pink transition-all disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink/40 mt-1.5">
              Pre-filled for a folded t-shirt in a poly mailer ({SHIPROCKET_DEFAULT_PARCEL_CM.length}×
              {SHIPROCKET_DEFAULT_PARCEL_CM.breadth}×{SHIPROCKET_DEFAULT_PARCEL_CM.height} cm, ~0.3 kg per item). Change
              them for hoodies or bigger parcels — the actual packed size gives accurate courier rates.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateShipment}
            disabled={isPending || blockedUnpaid}
            className="w-full flex items-center justify-center gap-2 bg-black hover:bg-pink-light text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            Ship via Shiprocket
          </button>
        </>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">Order sent to Shiprocket</span>
          </div>
          <div className="flex justify-between text-ink/60">
            <span>Shiprocket Order ID</span>
            <span className="font-mono text-ink">{shiprocketOrderId}</span>
          </div>

          {awbCode ? (
            <>
              <div className="flex justify-between text-ink/60">
                <span>AWB Code</span>
                <span className="font-mono text-ink">{awbCode}</span>
              </div>
              {courierName && (
                <div className="flex justify-between text-ink/60">
                  <span>Courier</span>
                  <span className="font-medium text-ink">{courierName}</span>
                </div>
              )}
              {status && (
                <div className="flex justify-between items-center text-ink/60">
                  <span>Live Status</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold capitalize">
                    {status}
                  </span>
                </div>
              )}
              {currentLocation && (
                <div className="flex justify-between items-center text-ink/60">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-ink/40" /> Current Location
                  </span>
                  <span className="font-medium text-ink">{currentLocation}</span>
                </div>
              )}
              <a
                href={trackingUrl || `https://shiprocket.co/tracking/${awbCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold rounded-xl px-4 py-2.5 border border-cream-line text-ink hover:bg-cream-deep transition-colors"
              >
                Track Shipment <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {scans.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Tracking Timeline</p>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {scans.map((scan, idx) => (
                      <div key={idx} className="flex gap-2.5">
                        <div className="flex flex-col items-center pt-0.5">
                          <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-pink' : 'bg-ink/20'}`} />
                          {idx !== scans.length - 1 && <div className="w-px flex-1 bg-cream-line mt-1" />}
                        </div>
                        <div className="pb-2.5">
                          <p className="text-xs font-medium text-ink">{scan.activity || scan.status}</p>
                          {scan.location && <p className="text-[11px] text-ink/50">{scan.location}</p>}
                          {scan.date && (
                            <p className="text-[10px] text-ink/40 mt-0.5">
                              {new Date(scan.date).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {status && (
                <div className="flex justify-between items-center text-ink/60">
                  <span>Shiprocket Status</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold capitalize">
                    {status}
                  </span>
                </div>
              )}
              <p className="text-xs text-ink/60 italic">
                No courier assigned yet — go to Shiprocket and click &quot;Ship Now&quot; on this order. The AWB and
                courier will appear here automatically once you do (via webhook, or click refresh above).
              </p>
              <a
                href={SHIPROCKET_NEW_ORDERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold rounded-xl px-4 py-2.5 bg-black hover:bg-pink-light text-white transition-colors"
              >
                Open Shiprocket — Ship Now <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}
