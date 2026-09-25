import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({ email: email.toLowerCase().trim() })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email already subscribed' },
          { status: 409 }
        )
      }
      console.error('Newsletter subscription error:', error)
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Successfully subscribed!' })
  } catch (err) {
    console.error('Newsletter API error:', err)
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}