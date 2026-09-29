import ImageKit from 'imagekit'

function getImageKitInstance(): ImageKit | null {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

  if (!publicKey || !privateKey || !urlEndpoint) {
    return null
  }

  return new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  })
}

export function isImageKitConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
  )
}

export function getImageKit(): ImageKit {
  const ik = getImageKitInstance()
  if (!ik) {
    throw new Error('ImageKit is not configured. Please set ImageKit environment variables in .env.local')
  }
  return ik
}

export function getImageKitAuthParameters() {
  const ik = getImageKit()
  return ik.getAuthenticationParameters()
}

export async function uploadToImageKit(params: {
  file: Buffer | string
  fileName: string
  folder?: string
  tags?: string[]
  useUniqueFileName?: boolean
}) {
  const ik = getImageKit()
  return await ik.upload({
    file: params.file,
    fileName: params.fileName,
    folder: params.folder || '/rawflex',
    tags: params.tags,
    useUniqueFileName: params.useUniqueFileName ?? true,
  })
}

export async function deleteFromImageKit(fileId: string) {
  const ik = getImageKit()
  return await ik.deleteFile(fileId)
}
