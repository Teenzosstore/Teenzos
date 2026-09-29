'use client'

import React, { useTransition, useState, useEffect } from 'react'
import Link from 'next/link'
import { Coupon, deleteCoupon, toggleCouponStatus } from '@/actions/admin/coupons'
import { Trash2, ShieldCheck, ShieldAlert, Megaphone, Loader2 } from 'lucide-react'

export default function CouponsList({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [pending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    setCoupons(initialCoupons)
  }, [initialCoupons])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    startTransition(async () => {
      const res = await deleteCoupon(id)
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id))
      } else {
        alert(res.error || 'Failed to delete coupon')
      }
    })
  }

  const handleToggle = async (coupon: Coupon) => {
    setLoadingId(coupon.id)
    const newStatus = !coupon.is_active

    // Optimistic update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: newStatus } : c))
    )

    const res = await toggleCouponStatus(coupon.id, newStatus)
    if (!res.success) {
      alert(res.error || 'Failed to toggle status')
      // Rollback
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: coupon.is_active } : c))
      )
    }
    setLoadingId(null)
  }

  if (coupons.length === 0) {
    return (
      <div className="p-8 text-center text-ink/40 text-sm">
        No coupons created yet. Create one on the left to get started.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Banner linking to Announcement Marquee */}
      <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-[#FFE1ED]/70 via-panel to-panel rounded-xl border border-[#F72585]/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#F72585]" />
          <span className="text-ink font-medium">
            Active coupons can be highlighted on the top storefront announcement bar.
          </span>
        </div>
        <Link
          href="/admin/announcements"
          className="font-bold text-[#F72585] hover:underline flex items-center gap-1 shrink-0 ml-2"
        >
          Open Announcement Marquee ↗
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream-deep text-ink/60 text-xs font-bold uppercase border-b border-cream-line">
              <th className="p-4">Code</th>
              <th className="p-4">Type</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Min Purchase</th>
              <th className="p-4">Status (Click to toggle)</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-line text-sm text-ink/80">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-panel/50 transition-colors">
                <td className="p-4 font-bold text-ink font-mono">{coupon.code}</td>
                <td className="p-4 capitalize">{coupon.type}</td>
                <td className="p-4 font-bold text-[#F72585]">
                  {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                </td>
                <td className="p-4">₹{coupon.min_purchase}</td>
                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => handleToggle(coupon)}
                    disabled={loadingId === coupon.id}
                    className="cursor-pointer focus:outline-none"
                    title="Click to toggle active/inactive"
                  >
                    {loadingId === coupon.id ? (
                      <span className="inline-flex items-center gap-1 text-xs text-ink/50 bg-cream-deep px-2.5 py-1 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                      </span>
                    ) : coupon.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-full font-bold transition-colors">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-ink/60 bg-cream-deep hover:bg-cream-line px-2.5 py-1 rounded-full transition-colors">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Inactive
                      </span>
                    )}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    disabled={pending}
                    className="p-1.5 text-ink/40 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
