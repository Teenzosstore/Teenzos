'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import {
  Subscriber,
  deleteSubscriber,
  sendCampaignToSubscribers,
  CampaignPayload,
} from '@/actions/admin/subscribers'
import {
  Mail,
  Send,
  Trash2,
  Copy,
  Check,
  Search,
  Download,
  Sparkles,
  Tag,
  ShoppingBag,
  Zap,
  Eye,
  AlertCircle,
  Clock,
  Users,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface SubscribersManagerProps {
  initialSubscribers: Subscriber[]
}

const TEMPLATES: {
  id: string
  label: string
  icon: any
  data: CampaignPayload
}[] = [
  {
    id: 'new_drop',
    label: 'New Product Drop',
    icon: ShoppingBag,
    data: {
      subject: '🔥 Fresh Heat: New Streetwear Drop Just Landed!',
      badgeText: 'NEW DROP ALERT',
      headline: 'FRESH HEAT JUST DROPPED',
      bodyText:
        "The wait is over! Our newest collection of premium oversized tees, graphic hoodies, and streetwear essentials is live. Sizes are limited—secure your favorites before they sell out!",
      ctaText: 'EXPLORE NEW DROP',
      ctaUrl: 'https://teenzosstore.com/shop',
      offerCode: '',
    },
  },
  {
    id: 'special_offer',
    label: '10% Subscriber Offer',
    icon: Tag,
    data: {
      subject: '⚡ Exclusive VIP Offer: Take 10% Off Your Next Haul',
      badgeText: 'VIP SPECIAL OFFER',
      headline: 'EXCLUSIVE 10% OFF JUST FOR YOU',
      bodyText:
        "Because you're part of the TeenZos VIP crew, enjoy an extra 10% discount on any order this week. Use the exclusive coupon code below at checkout!",
      ctaText: 'SHOP WITH DISCOUNT',
      ctaUrl: 'https://teenzosstore.com/shop',
      offerCode: 'TEENZOS10',
    },
  },
  {
    id: 'flash_sale',
    label: 'Flash Sale Alert',
    icon: Zap,
    data: {
      subject: '🚨 24-HOUR FLASH SALE: Up to 30% Off Selected Styles!',
      badgeText: '24-HOUR FLASH SALE',
      headline: 'LIMITED TIME FLASH SALE',
      bodyText:
        "Get ready to elevate your drip. For the next 24 hours only, select bestsellers and seasonal pieces are marked down. Once they're gone, they're gone!",
      ctaText: 'SHOP THE FLASH SALE',
      ctaUrl: 'https://teenzosstore.com/shop',
      offerCode: 'FLASH30',
    },
  },
]

export default function SubscribersManager({ initialSubscribers }: SubscribersManagerProps) {
  const { showToast } = useToast()
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Campaign state
  const [campaign, setCampaign] = useState<CampaignPayload>({
    subject: TEMPLATES[0].data.subject,
    badgeText: TEMPLATES[0].data.badgeText,
    headline: TEMPLATES[0].data.headline,
    bodyText: TEMPLATES[0].data.bodyText,
    ctaText: TEMPLATES[0].data.ctaText,
    ctaUrl: TEMPLATES[0].data.ctaUrl,
    offerCode: TEMPLATES[0].data.offerCode,
  })

  const [activeTemplate, setActiveTemplate] = useState<string>('new_drop')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSending, startSending] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const handleApplyTemplate = (tplId: string) => {
    const found = TEMPLATES.find((t) => t.id === tplId)
    if (found) {
      setActiveTemplate(tplId)
      setCampaign({ ...found.data })
      showToast(`Applied "${found.label}" template`, 'info')
    }
  }

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    showToast('Email copied to clipboard', 'info')
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from subscribers?`)) return
    setIsDeleting(id)
    try {
      const res = await deleteSubscriber(id)
      if (res.success) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id))
        showToast('Subscriber removed successfully', 'success')
      } else {
        showToast(res.error || 'Failed to remove subscriber', 'error')
      }
    } catch {
      showToast('Error removing subscriber', 'error')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast('No subscribers to export', 'error')
      return
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Email,Date Subscribed']
        .concat(
          subscribers.map(
            (s) => `"${s.email}","${new Date(s.created_at).toISOString()}"`
          )
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `teenzos_subscribers_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast(`Exported ${subscribers.length} subscribers`, 'success')
  }

  const handleSendCampaign = () => {
    if (!campaign.subject.trim()) {
      showToast('Please enter an email subject line', 'error')
      return
    }
    if (!campaign.headline.trim()) {
      showToast('Please enter a headline', 'error')
      return
    }
    if (!campaign.bodyText.trim()) {
      showToast('Please enter the email body text', 'error')
      return
    }
    if (subscribers.length === 0) {
      showToast('No subscribers to send to!', 'error')
      return
    }

    setShowConfirmModal(true)
  }

  const confirmAndDispatchCampaign = () => {
    setShowConfirmModal(false)
    startSending(async () => {
      try {
        const res = await sendCampaignToSubscribers(campaign)
        if (res.success) {
          showToast(
            `🚀 Campaign dispatched! Successfully sent to ${res.sentCount} subscriber${
              res.sentCount === 1 ? '' : 's'
            }${res.failedCount > 0 ? ` (${res.failedCount} failed)` : ''}`,
            'success'
          )
        } else {
          showToast(res.error || 'Failed to send campaign', 'error')
        }
      } catch (err: any) {
        showToast(err?.message || 'Error sending campaign', 'error')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Top Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Subscribers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">
              Total Subscribers
            </p>
            <p className="text-3xl font-extrabold text-[#0B0D0E] mt-1 font-display">
              {subscribers.length}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Active VIP Audience
            </p>
          </div>
          <div className="w-12 h-12 bg-pink-50 text-[#F72585] rounded-xl flex items-center justify-center border border-pink-100 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Welcome Code Dispatched */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">
              Welcome Perk Active
            </p>
            <p className="text-2xl font-bold text-[#F72585] mt-1 tracking-tight">
              10% OFF
            </p>
            <p className="text-[11px] text-gray-500 font-medium mt-1">
              Code: <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">TEENZOS10</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100 shadow-xs">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* Delivery Engine */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">
              Email Dispatch Engine
            </p>
            <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1.5">
              Brevo API <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">READY</span>
            </p>
            <p className="text-[11px] text-gray-500 font-medium mt-1">
              Instant welcome + blast campaigns
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-xs">
            <Mail className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Campaign Broadcast Composer ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 via-white to-pink-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F72585]/10 text-[#F72585] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Subscribers Email Broadcast
            </div>
            <h2 className="text-xl font-bold text-[#0B0D0E]">
              Send Drop Alerts & Offers
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Broadcast announcements, new product arrivals, or discount codes to all {subscribers.length} verified subscribers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-gray-500" />
              Preview Email
            </button>

            <button
              type="button"
              onClick={handleSendCampaign}
              disabled={isSending || subscribers.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F72585] hover:bg-[#D91668] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-pink-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending to {subscribers.length}...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Broadcast ({subscribers.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Template Selectors */}
        <div className="p-4 sm:px-6 border-b border-gray-100 bg-gray-50/40">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2.5">
            Quick Campaign Presets:
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon
              const isSelected = activeTemplate === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B0D0E] text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#F72585]' : 'text-gray-500'}`} />
                  {tpl.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Campaign Form Inputs */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Line */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Subject Line <span className="text-[#F72585]">*</span>
              </label>
              <input
                type="text"
                value={campaign.subject}
                onChange={(e) => {
                  setCampaign({ ...campaign, subject: e.target.value })
                  setActiveTemplate('custom')
                }}
                placeholder="e.g. 🔥 New Drop: Oversized Graphic Tees Just Landed!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-pink-500/10 transition-all font-medium"
              />
            </div>

            {/* Top Badge Text */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Badge / Pill Tag
              </label>
              <input
                type="text"
                value={campaign.badgeText || ''}
                onChange={(e) => {
                  setCampaign({ ...campaign, badgeText: e.target.value })
                  setActiveTemplate('custom')
                }}
                placeholder="e.g. NEW DROP ALERT or VIP SALE"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-pink-500/10 transition-all font-mono text-xs"
              />
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Hero Headline <span className="text-[#F72585]">*</span>
              </label>
              <input
                type="text"
                value={campaign.headline}
                onChange={(e) => {
                  setCampaign({ ...campaign, headline: e.target.value })
                  setActiveTemplate('custom')
                }}
                placeholder="e.g. FRESH HEAT JUST DROPPED"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-pink-500/10 transition-all font-bold uppercase"
              />
            </div>

            {/* Message Body */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Message Body <span className="text-[#F72585]">*</span>
              </label>
              <textarea
                rows={3}
                value={campaign.bodyText}
                onChange={(e) => {
                  setCampaign({ ...campaign, bodyText: e.target.value })
                  setActiveTemplate('custom')
                }}
                placeholder="Tell your subscribers about the new drop, offer details, or special announcement..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-pink-500/10 transition-all leading-relaxed"
              />
            </div>

            {/* Promo Code (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Discount Coupon Code (Optional)
              </label>
              <input
                type="text"
                value={campaign.offerCode || ''}
                onChange={(e) => {
                  setCampaign({ ...campaign, offerCode: e.target.value })
                  setActiveTemplate('custom')
                }}
                placeholder="e.g. TEENZOS10 or DROP20"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-pink-500/10 transition-all font-mono font-bold uppercase tracking-wider"
              />
            </div>

            {/* CTA Button Text */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Button Text
              </label>
              <input
                type="text"
                value={campaign.ctaText || ''}
                onChange={(e) => {
                  setCampaign({ ...campaign, ctaText: e.target.value })
                  setActiveTemplate('custom')
                }}
                placeholder="e.g. SHOP NOW or CLAIM OFFER"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-pink-500/10 transition-all font-semibold uppercase text-xs"
              />
            </div>

            {/* CTA Button Link */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Button Destination URL
              </label>
              <input
                type="url"
                value={campaign.ctaUrl || ''}
                onChange={(e) => {
                  setCampaign({ ...campaign, ctaUrl: e.target.value })
                  setActiveTemplate('custom')
                }}
                placeholder="https://teenzosstore.com/shop"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-pink-500/10 transition-all font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Subscribers Directory & Management Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header & Controls */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[#0B0D0E]">
              Subscribers Directory
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-pink-50 text-[#F72585] font-bold text-xs border border-pink-100">
              {subscribers.length} total
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-pink-500/10 transition-all"
              />
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-800">
                {searchQuery ? 'No matching subscribers' : 'No subscribers yet'}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? `No email addresses found matching "${searchQuery}".`
                  : 'Customers who join through the footer or newsletter pill form will appear here automatically.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Subscriber Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Subscribed Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubscribers.map((subscriber) => {
                  const dateStr = new Date(subscriber.created_at).toLocaleDateString(
                    'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )
                  const isCopied = copiedEmail === subscriber.email

                  return (
                    <tr
                      key={subscriber.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      {/* Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-pink-50 text-[#F72585] flex items-center justify-center text-xs font-bold shrink-0">
                            {subscriber.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block text-xs sm:text-sm">
                              {subscriber.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          VIP Club
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {dateStr}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy email */}
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(subscriber.email)}
                            title="Copy Email"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isDeleting === subscriber.id}
                            onClick={() =>
                              handleDelete(subscriber.id, subscriber.email)
                            }
                            title="Delete Subscriber"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Email Live Preview Modal ── */}
      {mounted && showPreviewModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setShowPreviewModal(false)}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[5px] max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#F72585]" />
                <h4 className="font-bold text-gray-900 text-sm">
                  Email Preview (TeenZos Streetwear)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-gray-200/60 transition-colors"
              >
                Close ✕
              </button>
            </div>

            {/* Subject Preview bar */}
            <div className="px-5 py-2.5 bg-gray-100/70 border-b border-gray-200 text-xs text-gray-600 flex items-center gap-2">
              <span className="font-bold text-gray-700 uppercase tracking-wide">Subject:</span>
              <span className="text-gray-900 font-medium truncate">{campaign.subject}</span>
            </div>

            {/* Email Body Simulation */}
            <div className="p-6 bg-[#0B0D0E] text-white">
              {/* Header with logo */}
              <div className="text-center pb-6 border-b border-white/10">
                <div className="inline-block font-extrabold text-2xl tracking-[0.2em] font-display text-white">
                  TEENZOS<span className="text-[#F72585]">.</span>
                </div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-gray-400 font-bold mt-0.5">
                  EXCLUSIVE STREETWEAR
                </div>
              </div>

              {/* Email Content Box */}
              <div className="py-6 text-center">
                {campaign.badgeText && (
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#F72585] text-white mb-3">
                    {campaign.badgeText}
                  </span>
                )}

                <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-3 font-display">
                  {campaign.headline}
                </h1>

                <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed mb-6 whitespace-pre-line">
                  {campaign.bodyText}
                </p>

                {campaign.offerCode && (
                  <div className="my-5 p-4 rounded-xl bg-white/5 border border-dashed border-[#F72585]/60 max-w-xs mx-auto">
                    <div className="text-[10px] tracking-widest text-[#F72585] uppercase font-bold mb-1">
                      YOUR EXCLUSIVE CODE
                    </div>
                    <div className="text-xl font-mono font-black text-white tracking-widest">
                      {campaign.offerCode}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Apply at checkout to redeem
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="mt-6">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-block px-7 py-3 rounded-full bg-[#F72585] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-pink-500/30"
                  >
                    {campaign.ctaText || 'SHOP NOW'} →
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-white/10 text-center text-[10px] text-gray-500">
                You received this email because you subscribed to the TeenZos VIP club.
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false)
                  handleSendCampaign()
                }}
                className="px-4 py-2 rounded-xl bg-[#F72585] text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-[#D91668]"
              >
                Looks Good, Send Broadcast
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Confirmation Modal ── */}
      {mounted && showConfirmModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setShowConfirmModal(false)}
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#F72585] flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h4 className="text-lg font-bold text-gray-900 mb-1.5">
              Confirm Email Broadcast
            </h4>

            <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to dispatch this email to all{' '}
              <strong className="text-gray-900">{subscribers.length} subscribers</strong>?
              This action cannot be undone.
            </p>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 mb-5 text-xs space-y-1">
              <p className="text-gray-700">
                <strong>Subject:</strong> {campaign.subject}
              </p>
              {campaign.offerCode && (
                <p className="text-gray-700">
                  <strong>Offer Code:</strong> {campaign.offerCode}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndDispatchCampaign}
                className="px-5 py-2 rounded-xl bg-[#F72585] hover:bg-[#D91668] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-pink-500/25 transition-all"
              >
                Yes, Send Now
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
