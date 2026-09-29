'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getProductByIdOrSlug } from '@/lib/shopProducts'

export type ActionResult = {
  error?: string
  success?: boolean
}

export async function submitReview(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const productId = (formData.get('product_id') as string || '').trim()
    const rating = parseInt(formData.get('rating') as string, 10)
    const comment = (formData.get('comment') as string || '').trim()
    const reviewerName = (formData.get('reviewer_name') as string || '').trim()

    if (!productId) {
      return { error: 'Product ID is required.' }
    }

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return { error: 'Please select a valid rating between 1 and 5 stars.' }
    }

    if (!comment && !reviewerName) {
      return { error: 'Please enter a review message.' }
    }

    // Check user auth
    let userId: string | null = null
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      const userName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        reviewerName ||
        user.email?.split('@')[0] ||
        'Customer'

      await adminSupabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          full_name: userName,
        },
        { onConflict: 'id' }
      )
    } else {
      // For guest reviews, find an existing profile to satisfy the foreign key constraint
      const { data: defaultProfile } = await adminSupabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single()

      if (defaultProfile?.id) {
        userId = defaultProfile.id
      }
    }

    if (!userId) {
      return { error: 'Could not submit review at this time. Please log in.' }
    }

    // Ensure product exists in DB to prevent foreign key violation
    const { data: existingProd } = await adminSupabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .maybeSingle()

    if (!existingProd) {
      const local = getProductByIdOrSlug(productId)
      await adminSupabase.from('products').upsert({
        id: productId,
        name: local?.name || productId,
        slug: local?.slug || productId,
        price: local?.price || 1999,
        is_active: true,
      })
    }

    // Format review text with reviewer name if guest
    let storedText = comment
    if (!user && reviewerName) {
      storedText = `[Customer: ${reviewerName}]\n${comment}`
    }

    const { error: insertError } = await adminSupabase
      .from('reviews')
      .insert({
        id: crypto.randomUUID(),
        product_id: productId,
        user_id: userId,
        rating,
        review_text: storedText || null,
        is_approved: true, // Live approved so review count increments immediately
      })

    if (insertError) {
      console.error('Error submitting review:', insertError)
      return { error: 'Failed to submit review. Please try again.' }
    }

    // Recalculate product rating stats immediately
    const { data: allApprovedReviews } = await adminSupabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true)

    const newReviewCount = allApprovedReviews?.length || 0
    const newAverageRating =
      newReviewCount > 0
        ? Number(
            (
              allApprovedReviews.reduce(
                (sum: number, r: any) => sum + Number(r.rating || 5),
                0
              ) / newReviewCount
            ).toFixed(1)
          )
        : 0

    await adminSupabase
      .from('products')
      .update({
        rating: newAverageRating,
        review_count: newReviewCount,
      })
      .eq('id', productId)

    revalidatePath(`/shop/${productId}`)
    revalidatePath('/shop')
    revalidatePath('/')
    revalidatePath('/admin/reviews')

    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error submitting review:', err)
    return { error: err?.message || 'An unexpected error occurred.' }
  }
}
