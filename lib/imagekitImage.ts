import type { ImageLoaderProps } from 'next/image'

const PRODUCT_TARGET_WIDTHS = [400, 800, 1200, 1600] as const

export function getProductTargetWidth(requestedWidth: number): number {
  for (const w of PRODUCT_TARGET_WIDTHS) {
    if (w >= requestedWidth) return w
  }
  return 1600
}

/**
 * ImageKit Image Loader for next/image
 * Appends tr=w-{width},q-{quality},f-auto
 */
export function imagekitImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src) return src

  // If it's an ImageKit URL
  if (src.includes('ik.imagekit.io')) {
    // If the URL already has a transformation query param
    const urlObj = new URL(src)
    const existingTr = urlObj.searchParams.get('tr')
    const q = quality || 80
    
    // Build transformation string
    const trParams = [`w-${width}`, `q-${q}`, 'f-auto']
    if (existingTr) {
      // Merge transformations without duplicating width/quality
      urlObj.searchParams.set('tr', `${existingTr},${trParams.join(',')}`)
    } else {
      urlObj.searchParams.set('tr', trParams.join(','))
    }
    return urlObj.toString()
  }

  // Legacy fallback for any lingering Cloudinary URLs in existing database records
  if (src.startsWith('https://res.cloudinary.com/')) {
    const uploadSegment = '/image/upload/'
    if (src.includes(uploadSegment)) {
      return src.replace(
        uploadSegment,
        `${uploadSegment}f_auto,q_auto:good,c_limit,w_${width}/`
      )
    }
  }

  return src
}

export function imagekitLoaderFor(src: string | null | undefined) {
  if (!src) return undefined
  if (src.includes('ik.imagekit.io') || src.startsWith('https://res.cloudinary.com/')) {
    return imagekitImageLoader
  }
  return undefined
}

export function productImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const targetWidth = getProductTargetWidth(width)
  return imagekitImageLoader({ src, width: targetWidth, quality })
}

export function productLoaderFor(src: string | null | undefined) {
  return imagekitLoaderFor(src)
}

// Backward compatibility aliases
export const cloudinaryImageLoader = imagekitImageLoader
export const cloudinaryLoaderFor = imagekitLoaderFor
