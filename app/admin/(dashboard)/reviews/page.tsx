import { requireAdmin } from '@/lib/adminAuth'
import { ReviewList } from './_components/ReviewList'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Reviews Management | Admin',
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Product Reviews</h1>
          <p className="text-ink/60 text-sm mt-1">Manage and moderate customer reviews before they appear on the site.</p>
        </div>
      </div>

      <ReviewList initialReviews={reviews || []} />
    </div>
  )
}
