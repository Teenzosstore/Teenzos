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

  if (error) {
    console.error('Error fetching approved reviews:', error)
    return
  }

  const reviewCount = allReviews?.length || 0
  const averageRating =
    reviewCount > 0
      ? Number((allReviews.reduce((sum: number, review: any) => sum + Number(review.rating), 0) / reviewCount).toFixed(1))
      : 0

  await adminClient
    .from('products')
    .update({
      rating: averageRating,
      review_count: reviewCount,
    })
    .eq('id', productId)
}

export async function approveReview(
  _prevState: any,
  formDataOrId: FormData | string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) return { error: admin.error }

    const reviewId = typeof formDataOrId === 'string'
      ? formDataOrId
      : (formDataOrId.get('id') as string)

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
    revalidatePath(`/shop/${reviewData.product_id}`)
    return { success: true }
  } catch (error: any) {
    return { error: error?.message || 'Failed to approve review.' }
  }
}

export async function deleteReview(
  _prevState: any,
  formDataOrId: FormData | string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) return { error: admin.error }

    const reviewId = typeof formDataOrId === 'string'
      ? formDataOrId
      : (formDataOrId.get('id') as string)

    if (!reviewId) return { error: 'Review ID is required.' }

    const { data: reviewData } = await admin.adminClient
      .from('reviews')
      .select('product_id')
      .eq('id', reviewId)
      .maybeSingle()

    const productId = reviewData?.product_id

    const { error: deleteError } = await admin.adminClient
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) return { error: deleteError.message }

    if (productId) {
      await recalculateProductReviewStats(admin.adminClient, productId)
      revalidatePath(`/shop/${productId}`)
    }

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error: any) {
    return { error: error?.message || 'Failed to delete review.' }
  }
}
