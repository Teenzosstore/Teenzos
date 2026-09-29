'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  AnnouncementTickerItem,
  AnnouncementsConfig,
  CouponTickerConfig,
  DEFAULT_COUPON_TICKER,
  DEFAULT_TICKER_ITEMS,
} from '@/lib/announcements'
import { saveAnnouncementsConfig } from '@/actions/admin/announcements'
import { Coupon } from '@/actions/admin/coupons'
import {
  Check,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Truck,
  Zap,
  Flame,
  Sparkles,
  Tag,
  ShieldCheck,
  Megaphone,
  Star,
  Eye,
  ExternalLink,
  Ticket,
  Wand2,
} from 'lucide-react'

const ICON_MAP = {
  truck: Truck,
  zap: Zap,
  flame: Flame,
  sparkles: Sparkles,
  tag: Tag,
  shield: ShieldCheck,
  megaphone: Megaphone,
  star: Star,
} as const

type IconKey = keyof typeof ICON_MAP

const THEME_OPTIONS: {
  value: NonNullable<AnnouncementTickerItem['badge_theme']>
  label: string
  badgeBg: string
  badgeText: string
  iconColor: string
}[] = [
  {
    value: 'cyan',
    label: 'Cyber Cyan (Default)',
    badgeBg: 'bg-[#36B8C5]',
    badgeText: 'text-[#0B0D0E]',
    iconColor: 'text-[#36B8C5]',
  },
  {
    value: 'pink',
    label: 'Neon Pink',
    badgeBg: 'bg-[#F72585]',
    badgeText: 'text-white',
    iconColor: 'text-[#F72585]',
  },
  {
    value: 'orange',
    label: 'Flame Orange',
    badgeBg: 'bg-[#F47B20]',
    badgeText: 'text-[#0B0D0E]',
    iconColor: 'text-[#F47B20]',
  },
  {
    value: 'soft-pink',
    label: 'Soft Rose / Pink',
    badgeBg: 'bg-[#FFE1ED]',
    badgeText: 'text-[#F72585]',
    iconColor: 'text-[#36B8C5]',
  },
  {
    value: 'white',
    label: 'Pure White',
    badgeBg: 'bg-white',
    badgeText: 'text-[#0B0D0E]',
    iconColor: 'text-[#F72585]',
  },
  {
    value: 'cyan-subtle',
    label: 'Cyan Glass / Subtle',
    badgeBg: 'bg-[#36B8C5]/20',
    badgeText: 'text-[#36B8C5]',
    iconColor: 'text-[#36B8C5]',
  },
]

interface AnnouncementFormProps {
  initialConfig: AnnouncementsConfig
  availableCoupons?: Coupon[]
}

export function AnnouncementForm({
  initialConfig,
  availableCoupons = [],
}: AnnouncementFormProps) {
  const [isEnabled, setIsEnabled] = useState(initialConfig.is_enabled)

  // Dedicated Coupon Spotlight state
  const [couponConfig, setCouponConfig] = useState<CouponTickerConfig>(() => {
    if (initialConfig.coupon_item) return initialConfig.coupon_item
    return DEFAULT_COUPON_TICKER
  })

  // General announcements items (filtering out any old 'code' id)
  const [items, setItems] = useState<AnnouncementTickerItem[]>(() => {
    const raw = initialConfig.items && initialConfig.items.length > 0
      ? initialConfig.items
      : DEFAULT_TICKER_ITEMS
    return raw.filter((it) => it.id !== 'code')
  })

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Handler for adding a new general announcement
  const handleAddItem = () => {
    const newItem: AnnouncementTickerItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      badge: 'NEW DROP',
      badge_theme: 'cyan',
      icon: 'sparkles',
      text: 'LIMITED STREETWEAR DROP LIVE NOW',
      is_active: true,
    }
    setItems((prev) => [...prev, newItem])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setItems((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return
    setItems((prev) => {
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
  }

  const handleUpdateItem = (index: number, updates: Partial<AnnouncementTickerItem>) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to reset to standard streetwear announcements?'
      )
    ) {
      setItems(DEFAULT_TICKER_ITEMS.filter((it) => it.id !== 'code'))
      setCouponConfig(DEFAULT_COUPON_TICKER)
      setIsEnabled(true)
    }
  }

  // Auto-generate coupon announcement text from selected coupon in Manage Coupons
  const handleSelectCouponFromList = (code: string) => {
    const found = availableCoupons.find((c) => c.code.toUpperCase() === code.toUpperCase())
    if (found) {
      const discountText =
        found.type === 'percentage' ? `${found.value}% OFF` : `₹${found.value} FLAT OFF`
      const minText =
        found.min_purchase && found.min_purchase > 0
          ? ` ON ORDERS ABOVE ₹${found.min_purchase}`
          : ''
      setCouponConfig((prev) => ({
        ...prev,
        coupon_code: found.code,
        badge: `CODE: ${found.code}`,
        text: `GET ${discountText}${minText} • USE CODE: ${found.code} AT CHECKOUT`,
      }))
    } else {
      setCouponConfig((prev) => ({
        ...prev,
        coupon_code: code,
      }))
    }
  }

  const handleSave = () => {
    const validGeneralItems = items.filter((item) => item.text && item.text.trim())

    if (isEnabled && validGeneralItems.length === 0 && !couponConfig.is_enabled) {
      setError('Please add at least one announcement message or enable coupon marquee.')
      return
    }

    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await saveAnnouncementsConfig({
        is_enabled: isEnabled,
        items: validGeneralItems.map((it) => ({
          ...it,
          text: it.text.trim(),
          badge: it.badge?.trim() || '',
        })),
        coupon_item: {
          ...couponConfig,
          badge: couponConfig.badge?.trim() || 'CODE: TEENZOS10',
          text: couponConfig.text?.trim() || DEFAULT_COUPON_TICKER.text,
        },
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3500)
      }
    })
  }

  // Combined preview items for the top live ticker
  const activeGeneralItems = items.filter((it) => it.is_active && it.text.trim())
  const activePreviewItems: AnnouncementTickerItem[] = [...activeGeneralItems]

  if (couponConfig.is_enabled && couponConfig.text?.trim()) {
    const couponTickerItem: AnnouncementTickerItem = {
      id: 'coupon-preview-item',
      badge: couponConfig.badge,
      badge_theme: couponConfig.badge_theme || 'white',
      icon: (couponConfig.icon as any) || 'tag',
      text: couponConfig.text,
      is_active: true,
    }
    // Place coupon item at position 2 in preview for nice visual balance
    const insertIdx = Math.min(2, activePreviewItems.length)
    activePreviewItems.splice(insertIdx, 0, couponTickerItem)
  }

  const CouponIconComp =
    ICON_MAP[(couponConfig.icon as IconKey) || 'tag'] || Tag
  const couponTheme =
    THEME_OPTIONS.find((t) => t.value === couponConfig.badge_theme) ||
    THEME_OPTIONS.find((t) => t.value === 'white') ||
    THEME_OPTIONS[0]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── STICKY TOP ACTION BAR ── */}
      <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-40 bg-[#F8F9FA]/90 backdrop-blur-md py-3 px-3 sm:px-4 rounded-xl border border-cream-line/80 shadow-sm flex items-center justify-between gap-3 transition-all">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
            }`}
          />
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black text-ink truncate block uppercase tracking-tight">
              Announcement Marquee
            </span>
            <span className="text-[11px] text-ink/60 hidden sm:inline-block">
              {isEnabled
                ? `${activePreviewItems.length} messages active live`
                : 'Announcement Bar is Disabled'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {success && (
            <span className="hidden xs:inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200">
              <Check className="w-3.5 h-3.5 text-green-600" />
              Saved & Live!
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95"
            title="Save all changes to live announcement bar"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          Announcement Bar & Marquee Coupon Spotlight updated successfully & synced live!
        </div>
      )}

      {/* Live Preview Panel */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-ink/70" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
              Storefront Live Preview
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isEnabled && activePreviewItems.length > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {isEnabled && activePreviewItems.length > 0
              ? `Active (${activePreviewItems.length} messages live${
                  couponConfig.is_enabled ? ' • incl. coupon' : ''
                })`
              : 'Disabled'}
          </span>
        </div>

        {/* Mock Storefront Bar */}
        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0B0D0E] shadow-inner">
          {isEnabled && activePreviewItems.length > 0 ? (
            <div className="h-9 flex items-center overflow-x-auto no-scrollbar px-3 gap-4">
              {activePreviewItems.map((item, idx) => {
                const IconComp =
                  ICON_MAP[(item.icon as IconKey) || 'sparkles'] || Sparkles
                const theme =
                  THEME_OPTIONS.find((t) => t.value === item.badge_theme) ||
                  THEME_OPTIONS[0]
                const isCoupon = item.id === 'coupon-preview-item'

                return (
                  <div
                    key={`prev-${item.id || idx}`}
                    className={`flex items-center shrink-0 gap-2 ${
                      isCoupon
                        ? 'bg-white/5 py-1 px-2.5 rounded-md border border-white/10 ring-1 ring-[#F72585]/30'
                        : ''
                    }`}
                  >
                    {item.badge && (
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-[2px] tracking-[0.09em] leading-none ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <IconComp
                      className={`w-3.5 h-3.5 shrink-0 ${theme.iconColor}`}
                    />
                    <span className="font-bold text-[11px] text-[#F7F7F5] tracking-[0.08em] uppercase whitespace-nowrap">
                      {item.text}
                    </span>
                    <span className="text-[10px] text-[#36B8C5] pl-2 select-none">
                      ✦
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-9 flex items-center justify-center text-xs text-zinc-400 font-medium">
              Announcement bar is currently disabled / hidden on store
            </div>
          )}
        </div>
      </div>

      {/* Master Switch Card */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-ink">Enable Storefront Announcement Bar</h3>
          <p className="text-sm text-ink/60">
            When enabled, the animated marquee ticker is visible at the very top of all store pages.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            disabled={isPending}
          />
          <div className="w-11 h-6 bg-panel2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-ink/50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink after:border-ink/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
        </label>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. DEDICATED COUPON SECTION (Alag se 1 coupon ka section) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-panel rounded-2xl shadow-md border-2 border-[#F72585]/30 overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-[#FFE1ED] via-cream to-cream-deep p-5 border-b border-[#F72585]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F72585] to-[#FF2E93] text-white flex items-center justify-center shadow-md shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#0B0D0E] tracking-tight uppercase">
                  Coupon Marquee Spotlight
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#F72585] text-white rounded-[3px] tracking-wider">
                  Synced With Coupons
                </span>
              </div>
              <p className="text-xs text-ink/70 mt-0.5">
                Manage the promotional discount coupon featured in the announcement bar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Direct Link to Manage Coupons */}
            <Link
              href="/admin/settings/coupons"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#F72585] bg-white rounded-lg border border-[#F72585]/30 hover:bg-[#FFE1ED]/50 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Manage Coupons
            </Link>

            {/* Toggle switch for showing coupon in marquee */}
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-cream-line shadow-xs">
              <input
                type="checkbox"
                checked={couponConfig.is_enabled}
                onChange={(e) =>
                  setCouponConfig((prev) => ({ ...prev, is_enabled: e.target.checked }))
                }
                className="w-4 h-4 rounded text-[#F72585] focus:ring-[#F72585] accent-[#F72585]"
              />
              <span className="text-xs font-black uppercase text-[#0B0D0E]">
                {couponConfig.is_enabled ? 'Show in Marquee' : 'Paused in Marquee'}
              </span>
            </label>
          </div>
        </div>

        {/* Section Content */}
        <div className="p-6 space-y-5">
          {/* Coupon Selector from Store Coupons */}
          <div className="bg-cream-deep/60 p-4 rounded-xl border border-cream-line space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wide">
                  Choose Coupon from Store Database
                </label>
                <p className="text-xs text-ink/60">
                  Select an active discount code from your &quot;Manage Coupons&quot; system.
                </p>
              </div>

              {availableCoupons.length > 0 && (
                <span className="text-[11px] font-semibold text-ink/50 bg-panel px-2.5 py-1 rounded-md border border-cream-line">
                  {availableCoupons.length} coupon{availableCoupons.length > 1 ? 's' : ''} available
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8">
                <select
                  value={couponConfig.coupon_code || ''}
                  onChange={(e) => handleSelectCouponFromList(e.target.value)}
                  className="w-full px-3 py-2.5 bg-panel border border-cream-line rounded-lg text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-[#F72585]"
                >
                  <option value="">-- Select a Coupon from Store --</option>
                  {availableCoupons.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}
                      {c.min_purchase > 0 ? ` (Min. Order ₹${c.min_purchase})` : ''}
                      {!c.is_active ? ' [Inactive in Coupons]' : ''}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom Promo Code (manual entry)</option>
                </select>
              </div>

              <div className="sm:col-span-4">
                <button
                  type="button"
                  onClick={() => {
                    if (couponConfig.coupon_code) {
                      handleSelectCouponFromList(couponConfig.coupon_code)
                    } else if (availableCoupons.length > 0) {
                      handleSelectCouponFromList(availableCoupons[0].code)
                    }
                  }}
                  className="w-full px-3 py-2.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#36B8C5]" />
                  Auto-Fill Ticker Text
                </button>
              </div>
            </div>

            {availableCoupons.length === 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>
                  No coupons found in your store database. You can still customize the ticker text below or create a coupon in Manage Coupons.
                </span>
                <Link
                  href="/admin/settings/coupons"
                  target="_blank"
                  className="font-bold underline ml-2 shrink-0 hover:text-amber-900"
                >
                  Create Coupon ↗
                </Link>
              </div>
            )}
          </div>

          {/* Form Fields for the Coupon Marquee */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Badge Label */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                Badge Label
              </label>
              <input
                type="text"
                value={couponConfig.badge || ''}
                onChange={(e) =>
                  setCouponConfig((prev) => ({ ...prev, badge: e.target.value }))
                }
                placeholder="e.g. CODE: TEENZOS10"
                className="w-full px-3 py-2 bg-panel border border-cream-line rounded-lg text-xs font-bold text-ink uppercase focus:outline-none focus:ring-1 focus:ring-[#F72585]"
              />
            </div>

            {/* Badge Color Theme */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                Color Theme
              </label>
              <select
                value={couponConfig.badge_theme || 'white'}
                onChange={(e) =>
                  setCouponConfig((prev) => ({
                    ...prev,
                    badge_theme: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 bg-panel border border-cream-line rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-[#F72585]"
              >
                {THEME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                Icon
              </label>
              <div className="relative">
                <select
                  value={couponConfig.icon || 'tag'}
                  onChange={(e) =>
                    setCouponConfig((prev) => ({
                      ...prev,
                      icon: e.target.value as any,
                    }))
                  }
                  className="w-full pl-8 pr-2 py-2 bg-panel border border-cream-line rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-[#F72585]"
                >
                  <option value="tag">Tag 🏷️</option>
                  <option value="zap">Zap ⚡</option>
                  <option value="flame">Flame 🔥</option>
                  <option value="sparkles">Sparkles ✨</option>
                  <option value="star">Star ⭐</option>
                  <option value="truck">Truck 🚚</option>
                  <option value="shield">Shield 🛡️</option>
                  <option value="megaphone">Megaphone 📢</option>
                </select>
                <CouponIconComp
                  className={`absolute left-2.5 top-2.5 w-3.5 h-3.5 pointer-events-none ${couponTheme.iconColor}`}
                />
              </div>
            </div>

            {/* Marquee Announcement Message */}
            <div className="sm:col-span-12">
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                Marquee Coupon Announcement Message
              </label>
              <input
                type="text"
                value={couponConfig.text || ''}
                onChange={(e) =>
                  setCouponConfig((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="e.g. GET 10% OFF ON YOUR FIRST STREETWEAR ORDER • USE CODE TEENZOS10"
                className="w-full px-3 py-2.5 bg-panel border border-cream-line rounded-lg text-xs font-bold text-ink uppercase focus:outline-none focus:ring-1 focus:ring-[#F72585]"
              />
            </div>
          </div>

          {/* Coupon Spotlight Mini-Preview */}
          <div className="p-3.5 bg-[#0B0D0E] rounded-xl border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] text-zinc-400 font-bold shrink-0">Ticker View:</span>
              <div className="flex items-center gap-2">
                {couponConfig.badge && (
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-[2px] tracking-[0.09em] leading-none ${couponTheme.badgeBg} ${couponTheme.badgeText}`}
                  >
                    {couponConfig.badge}
                  </span>
                )}
                <CouponIconComp
                  className={`w-3.5 h-3.5 shrink-0 ${couponTheme.iconColor}`}
                />
                <span className="font-bold text-[11.5px] text-[#F7F7F5] tracking-[0.08em] uppercase truncate">
                  {couponConfig.text || 'NO MESSAGE CONFIGURED'}
                </span>
              </div>
            </div>

            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                couponConfig.is_enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {couponConfig.is_enabled ? 'Active In Marquee' : 'Hidden'}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. GENERAL ANNOUNCEMENTS LIST (Shipping, Drops, Fabric, etc.) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-cream-line">
          <div>
            <h3 className="font-bold text-ink text-base">
              General Marquee Announcements ({items.length})
            </h3>
            <p className="text-xs text-ink/60">
              Manage non-coupon messages (free shipping, drops, 240+ GSM fabric, city craft).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 text-xs font-semibold text-ink/70 hover:text-ink bg-cream-deep hover:bg-panel2 rounded-lg border border-cream-line transition-colors flex items-center gap-1.5"
              title="Reset to default messages"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Message
            </button>
          </div>
        </div>

        {/* General Items List */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const IconComp =
              ICON_MAP[(item.icon as IconKey) || 'sparkles'] || Sparkles
            const currentTheme =
              THEME_OPTIONS.find((t) => t.value === item.badge_theme) ||
              THEME_OPTIONS[0]

            return (
              <div
                key={item.id || index}
                className={`p-4 rounded-xl border transition-all ${
                  item.is_active
                    ? 'bg-cream-deep/60 border-cream-line'
                    : 'bg-zinc-50 border-zinc-200 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cream-line/60">
                  <div className="flex items-center gap-2.5">
                    {/* Item Active Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={(e) =>
                          handleUpdateItem(index, { is_active: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 accent-orange-500"
                      />
                      <span className="text-xs font-bold text-ink">
                        {item.is_active ? 'Active' : 'Paused'}
                      </span>
                    </label>

                    <span className="text-xs text-ink/40">#{index + 1}</span>
                  </div>

                  {/* Move Up / Down / Delete */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 text-ink/60 hover:text-ink hover:bg-panel2 rounded-md disabled:opacity-30 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      className="p-1.5 text-ink/60 hover:text-ink hover:bg-panel2 rounded-md disabled:opacity-30 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Form Fields for this item */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3">
                  {/* Badge Text */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Badge Label
                    </label>
                    <input
                      type="text"
                      value={item.badge || ''}
                      onChange={(e) =>
                        handleUpdateItem(index, { badge: e.target.value })
                      }
                      placeholder="e.g. FREE DELIVERY"
                      className="w-full px-3 py-2 bg-panel border border-cream-line rounded-lg text-xs font-bold text-ink focus:outline-none focus:ring-1 focus:ring-orange-500 uppercase"
                    />
                  </div>

                  {/* Badge Theme */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Color Theme
                    </label>
                    <select
                      value={item.badge_theme || 'cyan'}
                      onChange={(e) =>
                        handleUpdateItem(index, {
                          badge_theme: e.target
                            .value as AnnouncementTickerItem['badge_theme'],
                        })
                      }
                      className="w-full px-3 py-2 bg-panel border border-cream-line rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {THEME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Icon Selector */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Icon
                    </label>
                    <div className="relative">
                      <select
                        value={item.icon || 'sparkles'}
                        onChange={(e) =>
                          handleUpdateItem(index, {
                            icon: e.target.value as AnnouncementTickerItem['icon'],
                          })
                        }
                        className="w-full pl-8 pr-2 py-2 bg-panel border border-cream-line rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="truck">Truck 🚚</option>
                        <option value="zap">Zap ⚡</option>
                        <option value="flame">Flame 🔥</option>
                        <option value="sparkles">Sparkles ✨</option>
                        <option value="tag">Tag 🏷️</option>
                        <option value="shield">Shield 🛡️</option>
                        <option value="megaphone">Megaphone 📢</option>
                        <option value="star">Star ⭐</option>
                      </select>
                      <IconComp
                        className={`absolute left-2.5 top-2.5 w-3.5 h-3.5 pointer-events-none ${currentTheme.iconColor}`}
                      />
                    </div>
                  </div>

                  {/* Main Announcement Message */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Announcement Message
                    </label>
                    <input
                      type="text"
                      value={item.text || ''}
                      onChange={(e) =>
                        handleUpdateItem(index, { text: e.target.value })
                      }
                      placeholder="e.g. PAN-INDIA EXPRESS SHIPPING ON ALL ORDERS"
                      className="w-full px-3 py-2 bg-panel border border-cream-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-orange-500 uppercase"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Save Bar */}
        <div className="pt-4 border-t border-cream-line flex items-center justify-between">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px] shadow-sm cursor-pointer"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              'Save All Changes'
            )}
          </button>

          {success && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <Check className="w-4 h-4" />
              Saved & Live!
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
