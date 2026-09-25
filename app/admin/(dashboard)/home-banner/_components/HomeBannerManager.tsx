'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import {
  createHomeBannerImage,
  deleteHomeBannerImage,
  setHomeBannerEnabled,
  toggleHomeBannerImageStatus,
  updateHomeBannerImageLink,
} from '@/actions/admin/homeBanner'
import { Trash2, Plus, Image as ImageIcon, Loader2, Link as LinkIcon } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'

type BannerImage = {
  id: string
  image_url: string
  link_url: string | null
  is_active: boolean
}

export function HomeBannerManager({
  initialEnabled,
  initialImages,
}: {
  initialEnabled: boolean
  initialImages: BannerImage[]
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [images, setImages] = useState<BannerImage[]>(initialImages)
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialImages.map((img) => [img.id, img.link_url || '']))
  )
  const [isPending, startTransition] = useTransition()

  const activeCount = images.filter((i) => i.is_active).length

  const handleToggleEnabled = () => {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const res = await setHomeBannerEnabled(next)
      if (!res.success) {
        setEnabled(!next)
        alert(res.error)
      }
    })
  }

  const handleUploadSuccess = (result: any) => {
    const imageUrl = result.info.secure_url

    startTransition(async () => {
      const res = await createHomeBannerImage(imageUrl, '')
      if (res.success) {
        window.location.reload()
      } else {
        alert(res.error)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this banner image?')) return

    startTransition(async () => {
      const res = await deleteHomeBannerImage(id)
      if (res.success) {
        setImages(images.filter((i) => i.id !== id))
      }
    })
  }

  const handleToggleImage = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleHomeBannerImageStatus(id, !currentStatus)
      if (res.success) {
        setImages(images.map((i) => (i.id === id ? { ...i, is_active: !currentStatus } : i)))
      }
    })
  }

  const handleLinkBlur = (id: string) => {
    const linkUrl = linkDrafts[id] || ''
    startTransition(async () => {
      await updateHomeBannerImageLink(id, linkUrl)
      setImages(images.map((i) => (i.id === id ? { ...i, link_url: linkUrl || null } : i)))
    })
  }

  return (
    <div className="space-y-6">
      {/* Enable / Disable */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Show Banner on Homepage</h2>
          <p className="text-sm text-ink/60 mt-1">
            Turn this on once you've added at least one active image below.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={handleToggleEnabled}
            disabled={isPending}
          />
          <div className="w-12 h-7 bg-panel2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-ink/50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink after:border-ink/50 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold"></div>
        </label>
      </div>

      {/* Images */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-ink/40" />
            <h2 className="text-lg font-bold text-ink">Banner Images</h2>
          </div>

          {images.length < 8 ? (
            <CldUploadWidget
              signatureEndpoint="/api/cloudinary/sign"
              options={{
                maxFiles: 1,
                resourceType: 'image',
                folder: "rawflex/home-banner",
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
              Maximum 8 images reached
            </span>
          )}
        </div>

        <p className="text-sm text-ink/60 mb-6 leading-relaxed">
          Upload wide landscape images for the best hero fit. They auto-swipe as the homepage hero background. You have {activeCount} active image{activeCount === 1 ? '' : 's'}.
        </p>

        <div className="space-y-4">
          {images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-cream-line rounded-xl bg-cream-deep">
              <ImageIcon className="w-8 h-8 text-ink/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-ink">No banner images yet</p>
              <p className="text-sm text-ink/60 mt-1">Upload a wide landscape image to start building the hero banner.</p>
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
                  <div className="w-32 aspect-[3/1] shrink-0 rounded-lg overflow-hidden relative bg-panel2 border border-cream-line">
                    <Image src={img.image_url} alt={`Banner ${index + 1}`} fill className="object-contain" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-semibold text-ink">Banner {index + 1}</p>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                      <input
                        type="text"
                        value={linkDrafts[img.id] ?? ''}
                        onChange={(e) => setLinkDrafts({ ...linkDrafts, [img.id]: e.target.value })}
                        onBlur={() => handleLinkBlur(img.id)}
                        placeholder="/shop or https://... (optional link when clicked)"
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
                      title="Delete Image"
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
