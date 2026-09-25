'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { createHeroSlide, deleteHeroSlide, toggleHeroSlideStatus, updateHeroSlide } from '@/actions/admin/hero'
import { Trash2, Plus, GripVertical, Image as ImageIcon, Loader2, Pencil, Check, X } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'

export function HeroSlideList({ 
  initialSlides, 
  position = 'right',
  title = 'Background Images & Slides'
}: { 
  initialSlides: any[], 
  position?: 'left' | 'right',
  title?: string
}) {
  const [slides, setSlides] = useState(initialSlides)
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    subtitle: '',
    button_text: '',
    button_link: '',
  })

  const startEdit = (slide: any) => {
    setEditForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      button_text: slide.button_text || '',
      button_link: slide.button_link || '',
    })
    setEditingId(slide.id)
  }

  const saveEdit = (id: string) => {
    startTransition(async () => {
      const res = await updateHeroSlide(id, {
        title: editForm.title,
        subtitle: editForm.subtitle,
        button_text: editForm.button_text,
        button_link: editForm.button_link,
      })
      if (res.success) {
        setSlides(slides.map(s => s.id === id ? { ...s, ...editForm } : s))
        setEditingId(null)
      } else {
        alert(res.error)
      }
    })
  }

  const handleUploadSuccess = (result: any) => {
    const imageUrl = result.info.secure_url
    
    startTransition(async () => {
      const res = await createHeroSlide(imageUrl, position)
      if (res.success) {
        window.location.reload()
      } else {
        alert(res.error)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this background image?')) return
    
    startTransition(async () => {
      const res = await deleteHeroSlide(id)
      if (res.success) {
        setSlides(slides.filter(s => s.id !== id))
      }
    })
  }

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleHeroSlideStatus(id, !currentStatus)
      if (res.success) {
        setSlides(slides.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s))
      }
    })
  }

  const activeCount = slides.filter(s => s.is_active).length

  return (
    <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-ink/40" />
          <h2 className="text-lg font-bold text-ink">{title}</h2>
        </div>
        
        {slides.length < 5 ? (
          <CldUploadWidget 
            signatureEndpoint="/api/cloudinary/sign"
            options={{
              maxFiles: 1,
              resourceType: "image",
              folder: "rawflex/hero-slides",
              clientAllowedFormats: ["jpg", "jpeg", "png", "webp"]
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
                Add Slide
              </button>
            )}
          </CldUploadWidget>
        ) : (
          <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            Maximum 5 slides reached
          </span>
        )}
      </div>

      <p className="text-sm text-ink/60 mb-6 leading-relaxed">
        Upload high-quality images (16:9 ratio recommended). They will loop automatically. You have {activeCount} active slides.
      </p>

      <div className="space-y-4">
        {slides.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-cream-line rounded-xl bg-cream-deep">
            <ImageIcon className="w-8 h-8 text-ink/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-ink">No slides created</p>
            <p className="text-sm text-ink/60 mt-1">Upload an image to start building your hero section.</p>
          </div>
        ) : (
          slides.map((slide, index) => {
            return (
              <div key={slide.id} className={`flex flex-col rounded-xl border transition-all overflow-hidden ${slide.is_active ? 'border-cream-line bg-panel' : 'border-cream-line bg-cream-deep opacity-60'}`}>
                
                {/* Slide Header Row */}
                <div className="flex items-center gap-4 p-4">
                  <div className="cursor-move text-ink/40 hover:text-ink p-1">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="h-16 w-28 shrink-0 rounded-lg overflow-hidden relative bg-panel2 border border-cream-line">
                    <Image
                      src={slide.image_url}
                      alt="Hero Background"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">Slide {index + 1}</p>
                    {slide.title ? (
                      <p className="text-xs text-ink/80 truncate mt-0.5 font-medium">
                        {slide.title.replace(/\n/g, ' / ')}
                      </p>
                    ) : null}
                    <p className="text-xs text-ink/60 truncate mt-0.5">
                      {slide.image_url.split('/').pop()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={slide.is_active}
                        onChange={() => handleToggle(slide.id, slide.is_active)}
                        disabled={isPending || (!slide.is_active && activeCount >= 5)}
                      />
                      <div className="w-9 h-5 bg-panel2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-ink/50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink after:border-ink/50 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold"></div>
                    </label>
                    
                    <button
                      onClick={() => startEdit(slide)}
                      disabled={isPending}
                      className="p-2 text-ink/40 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Edit Text & Button"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(slide.id)}
                      disabled={isPending}
                      className="p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ml-1"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {editingId === slide.id && (
                  <div className="border-t border-cream-line p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink/60 mb-1">Headline (use a new line for the gold accent line)</label>
                        <textarea
                          rows={2}
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink/60 mb-1">Subtitle</label>
                        <textarea
                          rows={2}
                          value={editForm.subtitle}
                          onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                          className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink/60 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={editForm.button_text}
                          onChange={(e) => setEditForm({ ...editForm, button_text: e.target.value })}
                          className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink/60 mb-1">Button Link</label>
                        <input
                          type="text"
                          value={editForm.button_link}
                          onChange={(e) => setEditForm({ ...editForm, button_link: e.target.value })}
                          placeholder="/shop"
                          className="block w-full rounded-lg bg-panel2 border border-cream-line px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(slide.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-black text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-panel2 text-ink text-sm font-semibold rounded-lg hover:bg-panel transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {isPending && (
        <div className="mt-4 flex items-center justify-center text-sm text-ink/60 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </div>
      )}

    </div>
  )
}
