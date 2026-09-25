'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Check, Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'
import {
  updateOversizedSectionSettings,
  type OversizedSectionSettings,
} from '@/actions/admin/oversizedSection'

export function OversizedSectionForm({
  initialSettings,
}: {
  initialSettings: OversizedSectionSettings
}) {
  const [settings, setSettings] = useState<OversizedSectionSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const updateField = (field: keyof OversizedSectionSettings, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const handleUploadSuccess = (result: any) => {
    const imageUrl = result.info.secure_url
    updateField('background_image_url', imageUrl)
  }

  const save = () => {
    startTransition(async () => {
      const res = await updateOversizedSectionSettings(settings)
      if (res.success) {
        setSaved(true)
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6">
      <div className="flex items-center gap-2 mb-6">
        <ImageIcon className="w-5 h-5 text-ink/40" />
        <h2 className="text-lg font-bold text-ink">Oversized Section</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-cream-line bg-cream-deep">
            <Image
              src={settings.background_image_url}
              alt="Oversized section background preview"
              fill
              sizes="360px"
              className="object-cover"
            />
          </div>

          <CldUploadWidget
            signatureEndpoint="/api/cloudinary/sign"
            options={{
              maxFiles: 1,
              resourceType: 'image',
              folder: "rawflex/oversized",
              clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            }}
            onSuccess={handleUploadSuccess}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                disabled={isPending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2 bg-panel2 text-ink text-sm font-semibold rounded-xl hover:bg-cream-deep transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Change Background Image
              </button>
            )}
          </CldUploadWidget>

          <label className="mt-4 block text-xs font-semibold text-ink/60 mb-1">
            Background Image URL
          </label>
          <input
            type="text"
            value={settings.background_image_url}
            onChange={(e) => updateField('background_image_url', e.target.value)}
            className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">
              Headline Top
            </label>
            <input
              type="text"
              value={settings.headline_top}
              onChange={(e) => updateField('headline_top', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">
              Headline Accent
            </label>
            <input
              type="text"
              value={settings.headline_accent}
              onChange={(e) => updateField('headline_accent', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink/60 mb-1">
              Subtitle
            </label>
            <textarea
              rows={3}
              value={settings.subtitle}
              onChange={(e) => updateField('subtitle', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={settings.button_text}
              onChange={(e) => updateField('button_text', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">
              Button Link
            </label>
            <input
              type="text"
              value={settings.button_link}
              onChange={(e) => updateField('button_link', e.target.value)}
              placeholder="/shop?category=oversized-tees"
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-black text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Oversized Section
            </button>
            {saved && <span className="text-sm text-ink/60">Saved</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
