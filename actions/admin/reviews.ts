'use server'

import { requireAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'

export type ActionResult = {
  error?: string
  success?: boolean
}

async function recalculateProductReviewStats(adminClient: any, productId: string) {
  const { data: allReviews, error } = await adminClient
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_approved', true)

  if (error) throw new Error(error.message)

  const reviewCount = allReviews?.length || 0
  const averageRating =
    reviewCount > 0
      ? Number((allReviews.reduce((sum: number, review: any) => sum + Number(review.rating), 0) / reviewCount).toFixed(1))
      : 0

  const { error: updateError } = await adminClient
    .from('products')
    .update({
      rating: averageRating,
      review_count: reviewCount,
    })
    .eq('id', productId)

  if (updateError) throw new Error(updateError.message)
}

export async function approveReview(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) return { error: admin.error }

    const reviewId = formData.get('id') as string
    if (!reviewId) return { error: 'Review ID is required.' }

    const { data: reviewData, error: reviewError } = await admin.adminClient
      .from('reviews')
      .select('product_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !reviewData?.product_id) {
      return { error: reviewError?.message || 'Review not found.' }
    }

    const { error: updateError } = await admin.adminClient
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', reviewId)

    if (updateError) return { error: updateError.message }

    await recalculateProductReviewStats(admin.adminClient, reviewData.product_id)

    revalidatePath('/admin/reviews')
    revalidatePath('/shop/[id]')
    return { success: true }
  } catch (error: any) {
    return { error: error?.message || 'Failed to approve review.' }
  }
}

export async function deleteReview(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) return { error: admin.error }

    const reviewId = formData.get('id') as string
    if (!reviewId) return { error: 'Review ID is required.' }

    const { data: reviewData, error: reviewError } = await admin.adminClient
      .from('reviews')
      .select('product_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !reviewData?.product_id) {
      return { error: reviewError?.message || 'Review not found.' }
    }

    const { error: deleteError } = await admin.adminClient
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) return { error: deleteError.message }

    await recalculateProductReviewStats(admin.adminClient, reviewData.product_id)

    revalidatePath('/admin/reviews')
    revalidatePath('/shop/[id]')
    return { success: true }
  } catch (error: any) {
    return { error: error?.message || 'Failed to delete review.' }
  }
}
