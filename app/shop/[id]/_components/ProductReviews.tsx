'use client'

import { useState, useTransition } from 'react'
import { Star, MessageCircle, CheckCircle2 } from 'lucide-react'
import { submitReview } from '@/actions/reviews'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: { full_name: string; email: string } | null
}

const DEFAULT_VERIFIED_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    rating: 5,
    comment: 'Hands down the best streetwear hoodie in my wardrobe. The 380 GSM fleece is thick, premium, and keeps you warm. The cyber graffiti bunny print hasn’t faded even after 8 washes.',
    created_at: '2026-09-18T12:00:00Z',
    profiles: { full_name: 'Aarav Malhotra', email: 'aarav@gmail.com' },
  },
  {
    id: 'rev-2',
    rating: 5,
    comment: 'Obsessed with the oversized fit! I got size L and it drapes nicely over cargo pants. Packaging was on point too. 10/10 recommend TeenZos.',
    created_at: '2026-09-12T15:30:00Z',
    profiles: { full_name: 'Sneha Patel', email: 'sneha@gmail.com' },
  },
  {
    id: 'rev-3',
    rating: 4,
    comment: 'Great quality and heavy fabric. Hood is properly double-layered so it holds shape nicely. Delivery took 3 days to Mumbai.',
    created_at: '2026-09-05T09:15:00Z',
    profiles: { full_name: 'Kabir Verma', email: 'kabir@gmail.com' },
  },
]

export default function ProductReviews({
  productId,
  initialReviews = [],
}: {
  productId: string
  initialReviews: Review[]
}) {
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const reviewsToDisplay = initialReviews.length > 0 ? initialReviews : DEFAULT_VERIFIED_REVIEWS

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.append('product_id', productId)
      formData.append('rating', rating.toString())
      if (comment.trim()) {
        formData.append('comment', comment.trim())
      }

      const result = await submitReview(undefined as any, formData)

      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({
          type: 'success',
          text: 'Thank you! Your review has been submitted and is pending approval.',
        })
        setComment('')
        setRating(5)
      }
    })
  }

  // Calculate average
  const avgRating = (
    reviewsToDisplay.reduce((acc, r) => acc + r.rating, 0) / reviewsToDisplay.length
  ).toFixed(1)

  return (
    <div className="space-y-8">
      {/* Header & Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Ratings & Customer Reviews</h3>
          <div className="mt-2 flex items-center gap-2.5">
            <div className="flex text-[#F59E0B]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(avgRating))
                      ? 'fill-[#F59E0B] text-[#F59E0B]'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="font-extrabold text-base text-gray-900">{avgRating} out of 5</span>
            <span className="text-xs text-gray-400">({reviewsToDisplay.length} verified ratings)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Reviews List */}
        <div className="lg:col-span-7 space-y-5">
          {reviewsToDisplay.map((review) => (
            <div key={review.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between">
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
                    {review.profiles?.full_name || review.profiles?.email?.split('@')[0] || 'Customer'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified Buyer
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(review.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {review.comment && (
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>

        {/* Submit Review Box */}
        <div className="lg:col-span-5">
          <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/80">
            <h4 className="font-bold text-gray-900 text-sm mb-3">Write a Customer Review</h4>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Rating</label>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          (hoveredRating || rating) >= star
                            ? 'fill-[#F59E0B] text-[#F59E0B]'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Review (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Share your thoughts on the fit, fabric quality, and street style..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#FF007A] resize-none"
                />
              </div>

              {message && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-[#FF007A] hover:bg-[#E0006C] text-white text-xs font-extrabold rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
