import { v2 as cloudinary } from 'cloudinary'
import { requireAdmin } from '@/lib/adminAuth'

type CloudinarySignParam = string | number | boolean | string[]

function normalizeSignParams(paramsToSign: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(paramsToSign).filter(([, value]) => {
      if (value === null || typeof value === 'undefined') return false
      if (Array.isArray(value)) return value.every(item => typeof item === 'string')
      return ['string', 'number', 'boolean'].includes(typeof value)
    })
  ) as Record<string, CloudinarySignParam>
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (admin.ok === false) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { paramsToSign } = body
  if (!paramsToSign || typeof paramsToSign !== 'object' || Array.isArray(paramsToSign)) {
    return Response.json({ error: 'Invalid signing parameters' }, { status: 400 })
  }

  const sanitizedParams = normalizeSignParams(paramsToSign as Record<string, unknown>)

  const timestamp = Number(sanitizedParams.timestamp)
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (!timestamp || Math.abs(nowSeconds - timestamp) > 10 * 60) {
    return Response.json({ error: 'Invalid upload timestamp' }, { status: 400 })
  }

  const folder = String(sanitizedParams.folder || '')
  if (folder && !folder.startsWith('rawflex/')) {
    return Response.json({ error: 'Uploads must target a rawflex folder' }, { status: 400 })
  }

  const resourceType = String(sanitizedParams.resource_type || 'image')
  if (resourceType !== 'image') {
    return Response.json({ error: 'Only image uploads are allowed' }, { status: 400 })
  }

  if (!process.env.CLOUDINARY_API_SECRET || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY) {
    return Response.json({ error: 'Cloudinary is not configured' }, { status: 500 })
  }

  // Configure cloudinary with the credentials from the environment
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  // Generate the signature
  const signature = cloudinary.utils.api_sign_request(
    sanitizedParams,
    process.env.CLOUDINARY_API_SECRET
  )

  return Response.json({ signature })
}
