'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, Type } from 'lucide-react'
import { updateHeroLeftText, type HeroLeftText } from '@/actions/admin/hero'

export function HeroLeftTextForm({ initialText }: { initialText: HeroLeftText }) {
  const [text, setText] = useState<HeroLeftText>(initialText)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const updateField = (field: keyof HeroLeftText, value: string) => {
    setText((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const save = () => {
    startTransition(async () => {
      const res = await updateHeroLeftText(text)
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
        <Type className="w-5 h-5 text-ink/40" />
        <h2 className="text-lg font-bold text-ink">Hero Section Text</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-cream-line bg-cream-deep p-6 min-h-[260px]">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black/70 to-gold/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gold text-xs font-bold tracking-[0.22em] uppercase">
                {text.eyebrow}
              </span>
              <span className="w-10 h-[1.5px] bg-gold" />
            </div>
            <h3 className="font-display text-4xl font-black uppercase leading-[0.92] text-white">
              <span className="block">{text.headline_top}</span>
              <span className="mt-1 block text-gold">{text.headline_accent}</span>
            </h3>
            <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-relaxed text-white/65">
              {text.subtitle}
            </p>
            <div className="mt-6 inline-flex items-center border border-gold px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-gold">
              {text.button_text}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Eyebrow</label>
            <input
              type="text"
              value={text.eyebrow}
              onChange={(e) => updateField('eyebrow', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Button Link</label>
            <input
              type="text"
              value={text.button_link}
              onChange={(e) => updateField('button_link', e.target.value)}
              placeholder="/shop"
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Headline Top</label>
            <input
              type="text"
              value={text.headline_top}
              onChange={(e) => updateField('headline_top', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Headline Accent</label>
            <input
              type="text"
              value={text.headline_accent}
              onChange={(e) => updateField('headline_accent', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink/60 mb-1">Subtitle</label>
            <textarea
              rows={3}
              value={text.subtitle}
              onChange={(e) => updateField('subtitle', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Button Text</label>
            <input
              type="text"
              value={text.button_text}
              onChange={(e) => updateField('button_text', e.target.value)}
              className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
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
              Save Hero Section
            </button>
            {saved && <span className="text-sm text-ink/60">Saved</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
