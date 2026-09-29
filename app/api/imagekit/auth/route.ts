import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { getImageKitAuthParameters, isImageKitConfigured } from '@/lib/imagekit'

export async function GET() {
  const admin = await requireAdmin()
  if (admin.ok === false) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isImageKitConfigured()) {
    return NextResponse.json(
      { error: 'ImageKit credentials missing in environment variables' },
      { status: 500 }
    )
  }

  try {
    const authParams = getImageKitAuthParameters()
    return NextResponse.json(authParams)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate ImageKit authentication parameters' },
      { status: 500 }
    )
  }
}
