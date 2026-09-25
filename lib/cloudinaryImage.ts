import type { ImageLoaderProps } from "next/image";

const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";
const PRODUCT_TARGET_WIDTHS = [400, 800, 1200, 1600] as const;

export function cloudinaryImageLoader({ src, width }: ImageLoaderProps): string {
  return src.replace(
    CLOUDINARY_UPLOAD_SEGMENT,
    `${CLOUDINARY_UPLOAD_SEGMENT}f_auto,q_auto:good,c_limit,w_${width}/`
  );
}

export function cloudinaryLoaderFor(src: string | null | undefined) {
  return src?.startsWith("https://res.cloudinary.com/")
    ? cloudinaryImageLoader
    : undefined;
}

export function getProductTargetWidth(requestedWidth: number): number {
  for (const w of PRODUCT_TARGET_WIDTHS) {
    if (w >= requestedWidth) return w;
  }
  return 1600;
}

export function getProductVariantUrl(src: string, width: number): string {
  if (!src || !src.startsWith("https://res.cloudinary.com/")) {
    return src;
  }

  const targetWidth = getProductTargetWidth(width);
  const uploadIndex = src.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) {
    return src;
  }

  const prefix = src.slice(0, uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length);
  let rest = src.slice(uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length);

  // Strip any old inline transformation segment if present (e.g. f_auto,q_auto,w_800/)
  if (rest.includes("/") && !rest.startsWith("v") && !rest.startsWith("rawflex/")) {
    const firstSlash = rest.indexOf("/");
    const segment = rest.slice(0, firstSlash);
    if (segment.includes(",") || segment.startsWith("w_") || segment.startsWith("c_") || segment.startsWith("f_")) {
      rest = rest.slice(firstSlash + 1);
    }
  }

  // Preserve version tag if present (e.g. v1741234567/)
  let version = "";
  if (/^v\d+\//.test(rest)) {
    const vMatch = rest.match(/^(v\d+\/)/);
    if (vMatch) {
      version = vMatch[1];
      rest = rest.slice(version.length);
    }
  }

  // Strip existing extension (.jpg, .jpeg, .png, .webp, etc.)
  let publicId = rest.replace(/\.[a-zA-Z0-9]+$/, "");

  // Strip existing _w400, _w800, etc. suffix if already in the publicId
  publicId = publicId.replace(/_w(400|800|1200|1600)$/, "");

  return `${prefix}${version}${publicId}_w${targetWidth}.webp`;
}

export function productImageLoader({ src, width }: ImageLoaderProps): string {
  return getProductVariantUrl(src, width);
}

export function productLoaderFor(src: string | null | undefined) {
  return src?.startsWith("https://res.cloudinary.com/")
    ? productImageLoader
    : undefined;
}
