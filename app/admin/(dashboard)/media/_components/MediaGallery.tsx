'use client'

import Image from 'next/image'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

type MediaItem = { folder: string; name: string; url: string }

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cream-deep/60 text-ink/60 hover:text-gold-light hover:bg-cream-deep text-[11px] font-medium transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-gold" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy URL'}
    </button>
  )
}

const folderLabels: Record<string, string> = {
  categories: 'Category Cards',
  hero: 'Hero Slides',
  lookbook: 'Lookbook',
  site: 'Homepage / Site Assets',
  samples: 'Samples',
}

export function MediaGallery({ images }: { images: MediaItem[] }) {
  const groups = images.reduce<Record<string, MediaItem[]>>((acc, img) => {
    ;(acc[img.folder] ||= []).push(img)
    return acc
  }, {})

  const displayLabel = (folder: string) => {
    if (folder.startsWith('categories / ')) return folder.replace('categories / ', '')
    return folderLabels[folder] || folder
  }

  return (
    <div className="space-y-10">
      {Object.entries(groups).map(([folder, items]) => (
        <section key={folder}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gold-light">
              {displayLabel(folder)}
            </h2>
            <span className="text-xs text-ink/50">{items.length} images</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((img) => (
              <div
                key={img.url}
                className="group rounded-xl border border-cream-line bg-panel overflow-hidden"
              >
                <div className="relative aspect-square bg-cream-deep">
                  <Image
                    src={img.url}
                    alt={img.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover"
                  />
                </div>
                <div className="p-2.5 space-y-2">
                  <p
                    className="text-[11px] font-medium text-ink/80 line-clamp-1"
                    title={img.name}
                  >
                    {img.name}
                  </p>
                  <CopyButton text={img.url} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}