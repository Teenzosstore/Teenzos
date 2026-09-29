import { requireAdmin } from '@/lib/adminAuth'
import { ReviewList } from './_components/ReviewList'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Product Reviews | Admin Dashboard',
}

export default async function AdminReviewsPage() {
  const admin = await requireAdmin()
  if (admin.ok === false) redirect('/admin/login')
  const supabase = admin.adminClient

  // Fetch all reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      products ( name ),
      profiles ( full_name, email )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-cream-line/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Product Reviews</h1>
          <p className="text-ink/60 text-xs sm:text-sm mt-0.5">
            Moderate customer ratings & feedback before publishing them live to the storefront.
          </p>
        </div>
      </div>

      <ReviewList initialReviews={reviews || []} />
    </div>
  )
}
