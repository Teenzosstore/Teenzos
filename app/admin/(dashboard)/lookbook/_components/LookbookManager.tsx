'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { CldUploadWidget } from 'next-cloudinary'
import { Image as ImageIcon, Link as LinkIcon, Loader2, Plus, Trash2 } from 'lucide-react'
import {
  createLookbookImage,
  deleteLookbookImage,
  toggleLookbookImageStatus,
  updateLookbookImageLink,
} from '@/actions/admin/lookbook'

type LookbookImage = {
  id: string
  image_url: string
  link_url: string | null
  is_active: boolean
}

export function LookbookManager({
  initialImages,
}: {
  initialImages: LookbookImage[]
}) {
  const [images, setImages] = useState<LookbookImage[]>(initialImages)
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialImages.map((img) => [img.id, img.link_url || '']))
  )
  const [isPending, startTransition] = useTransition()
  const activeCount = images.filter((img) => img.is_active).length

  const handleUploadSuccess = (result: any) => {
    const imageUrl = result.info.secure_url

    startTransition(async () => {
      const res = await createLookbookImage(imageUrl, '')
      if (res.success) {
        window.location.reload()
      } else {
        alert(res.error)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this lookbook image?')) return

    startTransition(async () => {
      const res = await deleteLookbookImage(id)
      if (res.success) {
        setImages(images.filter((img) => img.id !== id))
      } else {
        alert(res.error)
      }
    })
  }

  const handleToggleImage = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleLookbookImageStatus(id, !currentStatus)
      if (res.success) {
        setImages(images.map((img) => (img.id === id ? { ...img, is_active: !currentStatus } : img)))
      } else {
        alert(res.error)
      }
    })
  }

  const handleLinkBlur = (id: string) => {
    const linkUrl = linkDrafts[id] || ''

    startTransition(async () => {
      const res = await updateLookbookImageLink(id, linkUrl)
      if (res.success) {
        setImages(images.map((img) => (img.id === id ? { ...img, link_url: linkUrl || null } : img)))
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-ink/40" />
            <h2 className="text-lg font-bold text-ink">Lookbook Images</h2>
          </div>

          {images.length < 12 ? (
            <CldUploadWidget
              signatureEndpoint="/api/cloudinary/sign"
              options={{
                maxFiles: 1,
                resourceType: 'image',
                folder: "rawflex/lookbook",
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
              }}
              onSuccess={handleUploadSuccess}
            >
              {({ open }) => (
                <button
                  onClick={() => open()}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-panel text-ink text-sm font-semibold rounded-xl hover:bg-panel2 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Image
                </button>
              )}
            </CldUploadWidget>
          ) : (
            <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              Maximum 12 images reached
            </span>
          )}
        </div>

        <p className="text-sm text-ink/60 mb-6 leading-relaxed">
          Upload lifestyle or outfit images for the homepage Lookbook. Add an optional link to send shoppers to a product, collection, or external page. You have {activeCount} active image{activeCount === 1 ? '' : 's'}.
        </p>

        <div className="space-y-4">
          {images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-cream-line rounded-xl bg-cream-deep">
              <ImageIcon className="w-8 h-8 text-ink/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-ink">No lookbook images yet</p>
              <p className="text-sm text-ink/60 mt-1">Upload an image to start building the homepage Lookbook.</p>
            </div>
          ) : (
            images.map((img, index) => (
              <div
                key={img.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  img.is_active ? 'border-cream-line bg-panel' : 'border-cream-line bg-cream-deep opacity-60'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="w-32 aspect-[1.55/1] shrink-0 rounded-lg overflow-hidden relative bg-panel2 border border-cream-line">
                    <Image src={img.image_url} alt={`Lookbook ${index + 1}`} fill className="object-cover object-center" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-semibold text-ink">Lookbook {index + 1}</p>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                      <input
                        type="text"
                        value={linkDrafts[img.id] ?? ''}
                        onChange={(e) => setLinkDrafts({ ...linkDrafts, [img.id]: e.target.value })}
                        onBlur={() => handleLinkBlur(img.id)}
                        placeholder="/shop/product-slug or https://... (optional)"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-cream-line bg-cream-deep focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={img.is_active}
                        onChange={() => handleToggleImage(img.id, img.is_active)}
                        disabled={isPending}
                      />
                      <div className="w-9 h-5 bg-panel2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-ink/50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink after:border-ink/50 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold"></div>
                    </label>

                    <button
                      onClick={() => handleDelete(img.id)}
                      disabled={isPending}
                      className="p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ml-1"
                      title="Delete image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {isPending && (
          <div className="mt-4 flex items-center justify-center text-sm text-ink/60 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </div>
        )}
      </div>
    </div>
  )
}
