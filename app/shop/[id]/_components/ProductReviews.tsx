'use client'

import { useState, useEffect, useTransition } from 'react'
import { Star, CheckCircle2, MessageSquarePlus, Sparkles, User } from 'lucide-react'
import { submitReview } from '@/actions/reviews'
import { createClient } from '@/lib/supabase/client'

interface Review {
  id: string
  rating: number
  comment?: string | null
  review_text?: string | null
  created_at: string
  profiles?: { full_name: string; email: string } | null
}

function parseReviewData(review: Review) {
  const rawText = review.comment || review.review_text || ''
  const match = rawText.match(/^\[Customer:\s*([^\]]+)\]\s*([\s\S]*)$/)

  if (match) {
    return {
      name: match[1].trim(),
      comment: match[2].trim(),
    }
  }

  const profileName = review.profiles?.full_name || review.profiles?.email?.split('@')[0]
  return {
    name: profileName || 'Customer',
    comment: rawText,
  }
}

export default function ProductReviews({
  productId,
  initialReviews = [],
  currentUser: initialUser = null,
}: {
  productId: string
  initialReviews: Review[]
  currentUser?: { id: string; name?: string } | null
}) {
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string } | null>(initialUser)
  const [reviewsList, setReviewsList] = useState<Review[]>(initialReviews)
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [name, setName] = useState(initialUser?.name || '')
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setReviewsList(initialReviews)
  }, [initialReviews])

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser)
      setName(initialUser.name || '')
      return
    }

    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const userName =
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            user.email?.split('@')[0] ||
            'Customer'
          setCurrentUser({ id: user.id, name: userName })
          setName(userName)
        } else {
          setCurrentUser(null)
        }
      })
    } catch (e) {
      console.error(e)
    }
  }, [initialUser])

  const reviewsToDisplay = reviewsList

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!currentUser && !name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name.' })
      return
    }

    if (!comment.trim()) {
      setMessage({ type: 'error', text: 'Please write a brief review.' })
      return
    }

    startTransition(async () => {
      const reviewerDisplayName = currentUser ? (currentUser.name || 'Verified Customer') : name.trim()
      const formData = new FormData()
      formData.append('product_id', productId)
      formData.append('rating', rating.toString())
      formData.append('comment', comment.trim())
      if (reviewerDisplayName) {
        formData.append('reviewer_name', reviewerDisplayName)
      }

      const result = await submitReview(undefined as any, formData)

      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        const newReview: Review = {
          id: `review-${Date.now()}`,
          rating,
          comment: comment.trim(),
          review_text: comment.trim(),
          created_at: new Date().toISOString(),
          profiles: { full_name: reviewerDisplayName, email: '' },
        }
        setReviewsList((prev) => [newReview, ...prev])
        window.dispatchEvent(
          new CustomEvent('teenzos-review-added', {
            detail: { rating, productId },
          })
        )
        setMessage({
          type: 'success',
          text: 'Thank you! Your rating and review have been published.',
        })
        setComment('')
        if (!currentUser) setName('')
        setRating(5)
      }
    })
  }

  // Calculate real average (defaults to 5.0 when 0 reviews)
  const avgRating =
    reviewsToDisplay.length > 0
      ? (
          reviewsToDisplay.reduce((acc, r) => acc + (r.rating || 5), 0) /
          reviewsToDisplay.length
        ).toFixed(1)
      : '5.0'

  return (
    <div className="space-y-8">
      {/* Header & Score (Default 5 stars with (0), updates dynamically) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Ratings & Customer Reviews</h3>
          <div className="mt-2 flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <div className="flex items-center gap-0.5 text-[#F59E0B]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                    star <= Math.round(Number(avgRating))
                      ? 'fill-[#F59E0B] text-[#F59E0B]'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="font-extrabold text-sm sm:text-base text-gray-900">{avgRating} out of 5</span>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              ({reviewsToDisplay.length} {reviewsToDisplay.length === 1 ? 'verified review' : 'verified reviews'})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          {reviewsToDisplay.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FFF0F6] text-[#FF007A] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-sm sm:text-base">No Customer Reviews Yet</h4>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  Be the first to review this piece! Share your thoughts on the street fit, oversized drape, and fabric comfort.
                </p>
              </div>
            </div>
          ) : (
            reviewsToDisplay.map((review) => {
              const { name: reviewerName, comment: reviewComment } = parseReviewData(review)

              return (
                <div
                  key={review.id}
                  className="p-4 sm:p-5 rounded-xl border border-gray-100 bg-gray-50/60 space-y-2.5 transition-all hover:border-gray-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex text-[#F59E0B]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= review.rating
                                ? 'fill-[#F59E0B] text-[#F59E0B]'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                        {reviewerName}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    </div>

                    <span className="text-[11px] text-gray-400 shrink-0">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {reviewComment && (
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {reviewComment}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Submit Review Box */}
        <div className="lg:col-span-5">
          <div className="p-5 sm:p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="p-1.5 rounded-lg bg-[#FFF0F6] text-[#FF007A]">
                <MessageSquarePlus className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Write a Customer Review</h4>
                <p className="text-[11px] text-gray-500">Your feedback helps fellow streetwear enthusiasts.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Star Rating */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-1.5 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform hover:scale-115"
                      title={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          (hoveredRating || rating) >= star
                            ? 'fill-[#F59E0B] text-[#F59E0B]'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-gray-600">
                    {hoveredRating || rating} / 5
                  </span>
                </div>
              </div>

              {/* Reviewer Name: Hide if login, show if not login */}
              {currentUser ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-600">
                  <User className="w-4 h-4 text-[#FF007A] shrink-0" />
                  <span className="truncate">
                    Posting review as <strong className="text-gray-900 font-bold">{currentUser.name || 'Verified Customer'}</strong>
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul S."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#FF007A] focus:border-[#FF007A] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Review Details
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Share details about the fit, fabric quality, and comfort..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#FF007A] focus:border-[#FF007A] resize-none transition-all"
                />
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium animate-fade-in ${
                    message.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-[#FF007A] hover:bg-[#E0006C] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-[#FF007A]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isPending ? 'Submitting Review...' : 'Submit Review for Approval'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
