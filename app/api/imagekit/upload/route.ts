import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { uploadToImageKit, isImageKitConfigured } from '@/lib/imagekit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (admin.ok === false) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 })
    }

    if (!isImageKitConfigured()) {
      return NextResponse.json(
        { error: 'ImageKit credentials missing in environment variables' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || '/teenzos'
    const fileName = (formData.get('fileName') as string) || file?.name || `upload_${Date.now()}`

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload directly using official ImageKit Node SDK with privateKey
    const result = await uploadToImageKit({
      file: buffer,
      fileName,
      folder: folder.startsWith('/') ? folder : `/${folder}`,
      useUniqueFileName: true,
    })

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      url: result.url,
      name: result.name,
      size: result.size,
      filePath: result.filePath,
      thumbnailUrl: result.thumbnailUrl,
      width: result.width,
      height: result.height,
      info: {
        secure_url: result.url,
        url: result.url,
        public_id: result.fileId,
        fileId: result.fileId,
        width: result.width,
        height: result.height,
        original_filename: result.name,
      },
    })
  } catch (error: any) {
    console.error('API ImageKit upload error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
