import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewsletterWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({ email: cleanEmail })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "You're already on the VIP list!", alreadySubscribed: true },
          { status: 200 }
        )
      }
      console.error('Newsletter subscription error:', error)
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    // Send Welcome & 10% Discount email asynchronously via Brevo
    sendNewsletterWelcomeEmail({ toEmail: cleanEmail }).catch((err) => {
      console.error('Welcome email dispatch background error:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! Check your inbox for your 10% discount code.',
    })
  } catch (err) {
    console.error('Newsletter API error:', err)
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}