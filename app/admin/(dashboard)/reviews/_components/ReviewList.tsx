'use client'

import { useState, useTransition, useMemo } from 'react'
import { approveReview, deleteReview } from '@/actions/admin/reviews'
import {
  Star,
  CheckCircle2,
  Trash2,
  Clock,
  Search,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'
import Link from 'next/link'

export type AdminReview = {
  id: string
  product_id: string
  user_id: string
  rating: number
  review_text: string | null
  is_approved: boolean
  created_at: string
  products: { name: string } | null
  profiles: { full_name: string; email: string } | null
}

function parseAdminReview(review: AdminReview) {
  const rawText = review.review_text || ''
  const match = rawText.match(/^\[Customer:\s*([^\]]+)\]\s*([\s\S]*)$/)

  if (match) {
    return {
      reviewerName: match[1].trim(),
      comment: match[2].trim(),
      email: review.profiles?.email || 'Guest Customer',
    }
  }

  return {
    reviewerName: review.profiles?.full_name || review.profiles?.email?.split('@')[0] || 'Customer',
    comment: rawText,
    email: review.profiles?.email || 'Registered User',
  }
}

export function ReviewList({ initialReviews }: { initialReviews: AdminReview[] }) {
  const [reviews, setReviews] = useState<AdminReview[]>(initialReviews)
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Calculate metrics
  const totalCount = reviews.length
  const pendingCount = reviews.filter((r) => !r.is_approved).length
  const approvedCount = reviews.filter((r) => r.is_approved).length
  const avgRating =
    totalCount > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalCount).toFixed(1)
      : '5.0'

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Tab filter
      if (activeFilter === 'pending' && r.is_approved) return false
      if (activeFilter === 'approved' && !r.is_approved) return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const prodName = (r.products?.name || r.product_id).toLowerCase()
        const userEmail = (r.profiles?.email || '').toLowerCase()
        const userName = (r.profiles?.full_name || '').toLowerCase()
        const text = (r.review_text || '').toLowerCase()

        return (
          prodName.includes(query) ||
          userEmail.includes(query) ||
          userName.includes(query) ||
          text.includes(query)
        )
      }

      return true
    })
  }, [reviews, activeFilter, searchQuery])

  // Handle Approve
  const handleApprove = async (id: string) => {
    setIsProcessing(id)
    setFeedback(null)

    startTransition(async () => {
      const result = await approveReview({}, id)
      setIsProcessing(null)

      if (result.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r))
        )
        setFeedback({
          type: 'success',
          message: 'Review approved and published to product page!',
        })
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to approve review.',
        })
      }
    })
  }

  // Handle Delete
  const confirmDelete = async (id: string) => {
    setIsProcessing(id)
    setFeedback(null)

    startTransition(async () => {
      const result = await deleteReview({}, id)
      setIsProcessing(null)
      setDeleteConfirmId(null)

      if (result.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id))
        setFeedback({
          type: 'success',
          message: 'Review deleted successfully.',
        })
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to delete review.',
        })
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* 1. Quick Stats Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-panel rounded-2xl border border-cream-line/70 p-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-ink/50">Total Reviews</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-ink">{totalCount}</span>
            <span className="p-2 rounded-xl bg-cream-deep text-ink/70">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-panel rounded-2xl border border-cream-line/70 p-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-ink/50">Pending Approval</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-panel rounded-2xl border border-cream-line/70 p-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-ink/50">Approved Live</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600">{approvedCount}</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-panel rounded-2xl border border-cream-line/70 p-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-ink/50">Average Rating</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-ink flex items-center gap-1.5">
              {avgRating} <span className="text-sm font-normal text-ink/40">/ 5</span>
            </span>
            <span className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Star className="w-4 h-4 fill-gold" />
            </span>
          </div>
        </div>
      </div>

      {/* 2. Feedback Notification Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
              : 'bg-red-500/10 border-red-500/30 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-panel p-2.5 rounded-[5px] border border-cream-line/70 shadow-sm">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-cream-deep/60 rounded-[5px]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeFilter === 'all'
                ? 'bg-panel text-ink shadow-sm border border-cream-line/80'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            All Reviews ({totalCount})
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'pending'
                ? 'bg-panel text-amber-700 shadow-sm border border-cream-line/80'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            <span>Needs Approval</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 text-[10px]">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeFilter === 'approved'
                ? 'bg-panel text-emerald-700 shadow-sm border border-cream-line/80'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            Approved ({approvedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-ink/40 absolute left-3 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews or product..."
            className="w-full pl-8 pr-3 py-1.5 bg-cream-deep/50 border border-cream-line/70 rounded-[5px] text-xs text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      {/* 4. Modern Review Cards List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-panel rounded-2xl border border-cream-line p-12 text-center space-y-2">
          <MessageSquare className="w-10 h-10 text-ink/30 mx-auto" />
          <p className="text-sm font-bold text-ink">No Reviews Found</p>
          <p className="text-xs text-ink/50 max-w-sm mx-auto">
            {searchQuery
              ? 'No reviews match your current search query.'
              : activeFilter === 'pending'
              ? 'All reviews have been approved! No pending moderation.'
              : 'Customer submitted reviews will appear here for verification.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const { reviewerName, comment, email } = parseAdminReview(review)
            const isItemProcessing = isProcessing === review.id

            return (
              <div
                key={review.id}
                className="bg-panel rounded-2xl border border-cream-line/80 p-4 sm:p-5 shadow-sm hover:border-cream-line transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-cream-line/50 pb-3">
                  {/* Left: Customer + Product */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold/20 to-gold/40 border border-gold/30 flex items-center justify-center text-ink font-bold text-xs shrink-0">
                      {reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-ink">
                          {reviewerName}
                        </span>
                        <span className="text-[11px] text-ink/40">({email})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink/60 mt-0.5">
                        <span>Product:</span>
                        <Link
                          href={`/shop/${review.product_id}`}
                          target="_blank"
                          className="font-semibold text-gold-light hover:underline inline-flex items-center gap-1"
                        >
                          {review.products?.name || review.product_id}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badge & Date */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span className="text-[11px] text-ink/40">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {review.is_approved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Live on Storefront
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Approval
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating + Review Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-[#F59E0B]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-[#F59E0B] text-[#F59E0B]'
                            : 'fill-cream-line text-cream-line'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs font-extrabold text-ink">
                      {review.rating}.0 Star Rating
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-ink/80 leading-relaxed bg-cream-deep/40 p-3 rounded-xl border border-cream-line/50 whitespace-pre-line">
                    {comment || <span className="italic text-ink/40">No review text provided.</span>}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-ink/40">
                    ID: {review.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {!review.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(review.id)}
                        disabled={isItemProcessing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        {isItemProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Approve Review</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(review.id)}
                      disabled={isItemProcessing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-ink/50 hover:text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div
          onClick={() => setDeleteConfirmId(null)}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-panel rounded-2xl border border-cream-line/80 p-5 w-full max-w-sm space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-500/10 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Delete Review?</h3>
                <p className="text-xs text-ink/60 mt-0.5">
                  This review will be permanently deleted and removed from the store.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-cream-line/60">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-ink/70 hover:text-ink bg-cream-deep hover:bg-panel2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
