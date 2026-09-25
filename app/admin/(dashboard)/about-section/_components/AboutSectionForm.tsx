'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { CldUploadWidget } from 'next-cloudinary'
import { Check, Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { updateAboutSectionSettings } from '@/actions/admin/aboutSection'
import type { AboutSectionSettings } from '@/lib/aboutSection'

export function AboutSectionForm({
  initialSettings,
}: {
  initialSettings: AboutSectionSettings
}) {
  const [settings, setSettings] = useState<AboutSectionSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const updateField = (field: keyof AboutSectionSettings, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const handleUploadSuccess = (result: any) => {
    updateField('image_url', result.info.secure_url)
  }

  const save = () => {
    startTransition(async () => {
      const res = await updateAboutSectionSettings(settings)
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
        <h2 className="text-lg font-bold text-ink">About Page Story</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          <div className="relative aspect-[5/6] overflow-hidden rounded-xl border border-cream-line bg-cream-deep">
            <Image
              src={settings.image_url}
              alt="About section image preview"
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
              folder: "rawflex/about",
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
                Change Story Image
              </button>
            )}
          </CldUploadWidget>

          <label className="mt-4 block text-xs font-semibold text-ink/60 mb-1">
            Image URL
          </label>
          <input
            type="text"
            value={settings.image_url}
            onChange={(e) => updateField('image_url', e.target.value)}
            className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Eyebrow" value={settings.eyebrow} onChange={(value) => updateField('eyebrow', value)} />
          <TextInput label="Floating Badge Value" value={settings.badge_value} onChange={(value) => updateField('badge_value', value)} />
          <TextInput label="Headline Top" value={settings.headline_top} onChange={(value) => updateField('headline_top', value)} />
          <TextInput label="Headline Bottom" value={settings.headline_bottom} onChange={(value) => updateField('headline_bottom', value)} />
          <TextInput label="Floating Badge Label" value={settings.badge_label} onChange={(value) => updateField('badge_label', value)} />

          <div className="md:col-span-2">
            <TextArea label="Paragraph One" rows={4} value={settings.paragraph_one} onChange={(value) => updateField('paragraph_one', value)} />
          </div>

          <div className="md:col-span-2">
            <TextArea label="Paragraph Two" rows={3} value={settings.paragraph_two} onChange={(value) => updateField('paragraph_two', value)} />
          </div>

          <TextInput label="Stat 1 Value" value={settings.stat_one_value} onChange={(value) => updateField('stat_one_value', value)} />
          <TextInput label="Stat 1 Label" value={settings.stat_one_label} onChange={(value) => updateField('stat_one_label', value)} />
          <TextInput label="Stat 2 Value" value={settings.stat_two_value} onChange={(value) => updateField('stat_two_value', value)} />
          <TextInput label="Stat 2 Label" value={settings.stat_two_label} onChange={(value) => updateField('stat_two_label', value)} />
          <TextInput label="Stat 3 Value" value={settings.stat_three_value} onChange={(value) => updateField('stat_three_value', value)} />
          <TextInput label="Stat 3 Label" value={settings.stat_three_label} onChange={(value) => updateField('stat_three_label', value)} />

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-black text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save About Section
            </button>
            {saved && <span className="text-sm text-ink/60">Saved</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink/60 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
      />
    </div>
  )
}

function TextArea({
  label,
  rows,
  value,
  onChange,
}: {
  label: string
  rows: number
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink/60 mb-1">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
      />
    </div>
  )
}
