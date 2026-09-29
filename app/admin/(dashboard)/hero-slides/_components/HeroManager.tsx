'use client'

import React, { useState, useTransition, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Type,
  Layers,
  Eye,
  Plus,
  Trash2,
  Pencil,
  Check,
  Loader2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  X,
  Smartphone,
  Monitor,
} from 'lucide-react'
import {
  updateHeroLeftText,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  toggleHeroSlideStatus,
  type HeroLeftText,
} from '@/actions/admin/hero'
import { ImageKitUploadWidget } from '@/components/ImageKitUploadWidget'

// SVG Decorative Brush Underline for Preview
function PinkBrushUnderline({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 11 C 60 4, 160 3, 336 8 C 260 14, 140 16, 4 11 Z"
        fill="#F72585"
      />
    </svg>
  )
}

function PinkGraffitiCrown({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 32 L11 8 L22 22 L31 5 L40 23 L49 9 L51 32 Z"
        stroke="#F72585"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const DEFAULT_SAMPLE_SLIDES = [
  {
    id: 'sample-1',
    title: 'Cyber Bunny Oversized Hoodie - Noir Black',
    subtitle: 'Black',
    image_url: '/images/hero/producthero1.png',
    is_active: true,
  },
  {
    id: 'sample-2',
    title: 'Cyber Bunny Oversized Hoodie - Raw White',
    subtitle: 'White',
    image_url: '/images/hero/producthero3.png',
    is_active: true,
  },
  {
    id: 'sample-3',
    title: 'Cyber Bunny Oversized Hoodie - Neon Pink',
    subtitle: 'Pink',
    image_url: '/images/hero/producthero2.png',
    is_active: true,
  },
]

export function HeroManager({
  initialText,
  initialSlides,
}: {
  initialText: HeroLeftText
  initialSlides: any[]
}) {
  const [activeTab, setActiveTab] = useState<'content' | 'slides' | 'preview'>('content')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Hero Left Copy & CTAs Form State
  const [text, setText] = useState<HeroLeftText>(initialText)
  const [isPending, startTransition] = useTransition()
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Slides State
  const [slides, setSlides] = useState<any[]>(initialSlides)
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0)

  // Add Slide Form Modal State
  const [isAddSlideOpen, setIsAddSlideOpen] = useState(false)
  const [newSlideForm, setNewSlideForm] = useState({
    imageUrl: '',
    title: '',
    subtitle: '',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
  })

  // Edit Slide Form Modal State
  const [editingSlide, setEditingSlide] = useState<any | null>(null)

  const activeSlides = slides.filter((s) => s.is_active)
  const previewSlides = activeSlides.length > 0 ? activeSlides : DEFAULT_SAMPLE_SLIDES
  const currentPreviewProduct = previewSlides[previewSlideIdx] || previewSlides[0]

  // Handle Save Hero Text & Buttons
  const handleSaveText = () => {
    startTransition(async () => {
      const res = await updateHeroLeftText(text)
      if (res.success) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
      } else {
        alert(res.error || 'Failed to save hero section')
      }
    })
  }

  // Handle Create Slide
  const handleCreateSlide = (imageUrlToUse?: string) => {
    const finalUrl = imageUrlToUse || newSlideForm.imageUrl.trim()
    if (!finalUrl) {
      alert('Please provide an image URL or upload an image.')
      return
    }

    startTransition(async () => {
      const res = await createHeroSlide(finalUrl, 'right', {
        title: newSlideForm.title.trim() || 'Cyber Bunny Oversized Hoodie',
        subtitle: newSlideForm.subtitle.trim() || 'Style',
        button_text: newSlideForm.buttonText.trim() || 'Shop Now',
        button_link: newSlideForm.buttonLink.trim() || '/shop',
      })

      if (res.success) {
        window.location.reload()
      } else {
        alert(res.error || 'Failed to add slide')
      }
    })
  }

  // Handle Save Edit Slide
  const handleSaveEditSlide = () => {
    if (!editingSlide) return
    startTransition(async () => {
      const res = await updateHeroSlide(editingSlide.id, {
        title: editingSlide.title,
        subtitle: editingSlide.subtitle,
        button_text: editingSlide.button_text,
        button_link: editingSlide.button_link,
      })

      if (res.success) {
        setSlides(slides.map((s) => (s.id === editingSlide.id ? { ...s, ...editingSlide } : s)))
        setEditingSlide(null)
      } else {
        alert(res.error || 'Failed to update slide')
      }
    })
  }

  // Handle Delete Slide
  const handleDeleteSlide = (id: string) => {
    if (!confirm('Are you sure you want to delete this hero product slide?')) return
    startTransition(async () => {
      const res = await deleteHeroSlide(id)
      if (res.success) {
        setSlides(slides.filter((s) => s.id !== id))
        if (previewSlideIdx >= slides.length - 1) {
          setPreviewSlideIdx(0)
        }
      } else {
        alert(res.error || 'Failed to delete slide')
      }
    })
  }

  // Handle Toggle Active Status
  const handleToggleSlide = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleHeroSlideStatus(id, !currentStatus)
      if (res.success) {
        setSlides(slides.map((s) => (s.id === id ? { ...s, is_active: !currentStatus } : s)))
      } else {
        alert(res.error || 'Failed to toggle status')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-pink-soft text-pink flex items-center justify-center font-bold text-base">
              ✦
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight font-sans">
              Hero Section Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Customize the homepage streetwear hero copy, CTAs, and interactive product showcase in Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {activeTab === 'content' && (
            <button
              onClick={handleSaveText}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-pink hover:bg-pink-dark active:scale-95 shadow-md shadow-pink/20 transition-all disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Saved to Supabase!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Hero Content</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/80 max-w-max">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'content'
              ? 'bg-white text-pink shadow-sm font-bold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Hero Text & Buttons</span>
        </button>

        <button
          onClick={() => setActiveTab('slides')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'slides'
              ? 'bg-white text-pink shadow-sm font-bold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Showcase ({slides.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'preview'
              ? 'bg-white text-pink shadow-sm font-bold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Full Hero Preview</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          TAB 1: HERO TEXT & CALL-TO-ACTIONS
         ══════════════════════════════════════════════════ */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Typography & Headline Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    Headlines & Copy
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Left Column
                </span>
              </div>

              {/* Eyebrow Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Eyebrow Badge Text
                </label>
                <input
                  type="text"
                  value={text.eyebrow}
                  onChange={(e) => setText({ ...text, eyebrow: e.target.value })}
                  placeholder="STREETWEAR"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:bg-white focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20 transition-all"
                />
                <p className="text-[11px] text-gray-400 mt-1">Small badge above the main title.</p>
              </div>

              {/* Headline Top Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Main Headline (Line 1 - Bold Black)
                </label>
                <input
                  type="text"
                  value={text.headline_top}
                  onChange={(e) => setText({ ...text, headline_top: e.target.value })}
                  placeholder="EXPRESS WHAT"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-bold focus:bg-white focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20 transition-all font-display tracking-wide uppercase"
                />
              </div>

              {/* Headline Accent Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Accent Headline (Line 2 - Hot Pink with Brush Stroke)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={text.headline_accent}
                    onChange={(e) => setText({ ...text, headline_accent: e.target.value })}
                    placeholder="MOVES YOU"
                    className="w-full bg-pink-50/40 border border-pink/30 rounded-xl px-3.5 py-2.5 text-sm text-pink font-extrabold focus:bg-white focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20 transition-all font-display tracking-wide uppercase"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Rendered in brand hot pink with the signature graffiti brush underline.
                </p>
              </div>

              {/* Subtitle Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Subtitle Description
                </label>
                <textarea
                  rows={3}
                  value={text.subtitle}
                  onChange={(e) => setText({ ...text, subtitle: e.target.value })}
                  placeholder="Bold designs. Premium comfort.&#10;More than clothes, it’s a mindset."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:bg-white focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20 transition-all"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Use line breaks to split lines for clean aesthetics.
                </p>
              </div>
            </div>

            {/* 2. Call-To-Action Buttons Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-pink" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    Call-to-Action Buttons
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  2 Buttons
                </span>
              </div>

              {/* Primary Pink Button */}
              <div className="p-4 rounded-xl bg-pink-50/30 border border-pink/20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Primary CTA Button (Hot Pink Fill)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={text.button_text}
                      onChange={(e) => setText({ ...text, button_text: e.target.value })}
                      placeholder="Shop Now"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-pink focus:ring-1 focus:ring-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Destination URL
                    </label>
                    <input
                      type="text"
                      value={text.button_link}
                      onChange={(e) => setText({ ...text, button_link: e.target.value })}
                      placeholder="/shop"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-pink focus:ring-1 focus:ring-pink"
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Outline Button */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Secondary CTA Button (Dark Outline)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={text.secondary_button_text || 'Explore Collections'}
                      onChange={(e) =>
                        setText({ ...text, secondary_button_text: e.target.value })
                      }
                      placeholder="Explore Collections"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-pink focus:ring-1 focus:ring-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Destination URL
                    </label>
                    <input
                      type="text"
                      value={text.secondary_button_link || '/shop'}
                      onChange={(e) =>
                        setText({ ...text, secondary_button_link: e.target.value })
                      }
                      placeholder="/shop"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-pink focus:ring-1 focus:ring-pink"
                    />
                  </div>
                </div>
              </div>

              {/* Save Bar */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Updates apply across desktop & mobile hero section.
                </span>
                <button
                  type="button"
                  onClick={handleSaveText}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink hover:bg-pink-dark text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-pink/20 transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : savedSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{savedSuccess ? 'Saved!' : 'Save Hero Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Preview Column (5 Cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-pink" />
                Live Copy Preview
              </span>
              <span className="text-[11px] font-semibold text-pink bg-pink-soft px-2.5 py-0.5 rounded-full">
                Real-Time
              </span>
            </div>

            {/* Streetwear Live Styled Box */}
            <div className="rounded-2xl border border-gray-200/90 shadow-md bg-[#F1F1EF] p-6 relative overflow-hidden text-center sm:text-left select-none">
              <div className="relative z-10">
                {/* Eyebrow */}
                <div className="mb-2">
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] text-[#0B0D0E] uppercase inline-block">
                    {text.eyebrow || 'STREETWEAR'}
                  </span>
                </div>

                {/* Headline */}
                <h2 className="flex flex-col uppercase tracking-tight">
                  <span className="font-display font-black text-[#0B0D0E] text-3xl sm:text-4xl leading-[0.92] mb-1">
                    {text.headline_top || 'EXPRESS WHAT'}
                  </span>

                  <div className="relative inline-block mt-2">
                    <span className="font-display font-black tracking-tight text-[#F72585] text-3xl sm:text-4xl leading-[0.92] block transform -skew-x-6">
                      {text.headline_accent || 'MOVES YOU'}
                    </span>
                    <div className="w-[85%] mt-1">
                      <PinkBrushUnderline className="w-full h-2.5 text-[#F72585]" />
                    </div>
                  </div>
                </h2>

                {/* Subtitle */}
                <p className="mt-4 text-[#1A1E20] text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line">
                  {text.subtitle || 'Bold designs. Premium comfort.\nMore than clothes, it’s a mindset.'}
                </p>

                {/* Two CTA Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 mt-5">
                  <div className="inline-flex items-center justify-center gap-1.5 bg-[#F72585] text-white font-semibold text-xs px-4 py-2 rounded-[5px] shadow-sm">
                    <span>{text.button_text || 'Shop Now'}</span>
                    <span>→</span>
                  </div>

                  <div className="inline-flex items-center justify-center gap-1.5 bg-transparent text-[#0B0D0E] font-semibold text-xs px-3.5 py-2 rounded-[5px] border-[1.5px] border-[#0B0D0E]/80">
                    <span>{text.secondary_button_text || 'Explore Collections'}</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2: HERO PRODUCT SHOWCASE SLIDES
         ══════════════════════════════════════════════════ */}
      {activeTab === 'slides' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-pink" />
                Hero Product Hoodies & Color Switcher
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                These hoodies rotate on the right side of the hero section. Their color tags appear in the bottom-right thumbnail switcher.
              </p>
            </div>

            <button
              onClick={() => setIsAddSlideOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink hover:bg-pink-dark text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-pink/20 active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product Hoodie</span>
            </button>
          </div>

          {/* Add Slide Modal / Expandable Card */}
          {isAddSlideOpen && (
            <div className="bg-white rounded-2xl border-2 border-pink/30 shadow-lg p-6 animate-in fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-pink" />
                  Add New Product Slide
                </h4>
                <button
                  onClick={() => setIsAddSlideOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Image Upload / Input Column */}
                <div className="sm:col-span-4 space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase">
                    Hoodie Product Image
                  </label>
                  <div className="relative h-44 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-3 overflow-hidden">
                    {newSlideForm.imageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={newSlideForm.imageUrl}
                          alt="Preview"
                          fill
                          unoptimized
                          className="object-contain"
                        />
                        <button
                          onClick={() => setNewSlideForm({ ...newSlideForm, imageUrl: '' })}
                          className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <ImageKitUploadWidget
                        options={{
                          maxFiles: 1,
                          folder: 'teenzos/hero-slides',
                          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                        }}
                        onSuccess={(result) => {
                          const url = result.url || result.info?.secure_url
                          setNewSlideForm({ ...newSlideForm, imageUrl: url })
                        }}
                      >
                        {({ open, isUploading }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            disabled={isUploading}
                            className="flex flex-col items-center justify-center text-center p-2 hover:text-pink transition-colors"
                          >
                            <UploadCloud className="w-8 h-8 text-pink mb-1" />
                            <span className="text-xs font-bold text-gray-900">
                              {isUploading ? 'Uploading...' : 'Click to Upload Image'}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              PNG with transparent background recommended
                            </span>
                          </button>
                        )}
                      </ImageKitUploadWidget>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newSlideForm.imageUrl}
                    onChange={(e) => setNewSlideForm({ ...newSlideForm, imageUrl: e.target.value })}
                    placeholder="Or paste direct image URL (/images/hero/...)"
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2"
                  />
                </div>

                {/* Details Column */}
                <div className="sm:col-span-8 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Product Name / Title
                    </label>
                    <input
                      type="text"
                      value={newSlideForm.title}
                      onChange={(e) => setNewSlideForm({ ...newSlideForm, title: e.target.value })}
                      placeholder="e.g. Cyber Bunny Oversized Hoodie - Noir Black"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:border-pink"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Color / Switcher Tag (shown on thumbnail)
                    </label>
                    <input
                      type="text"
                      value={newSlideForm.subtitle}
                      onChange={(e) =>
                        setNewSlideForm({ ...newSlideForm, subtitle: e.target.value })
                      }
                      placeholder="e.g. Noir Black, Raw White, Hot Pink"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:border-pink"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={newSlideForm.buttonText}
                        onChange={(e) =>
                          setNewSlideForm({ ...newSlideForm, buttonText: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Target URL
                      </label>
                      <input
                        type="text"
                        value={newSlideForm.buttonLink}
                        onChange={(e) =>
                          setNewSlideForm({ ...newSlideForm, buttonLink: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddSlideOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateSlide()}
                      disabled={isPending || !newSlideForm.imageUrl}
                      className="px-5 py-2 bg-pink hover:bg-pink-dark text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                    >
                      {isPending ? 'Saving...' : 'Add to Hero Showcase'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slides List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-pink-soft text-pink mx-auto flex items-center justify-center font-bold">
                  ✦
                </div>
                <h4 className="font-bold text-gray-900 text-base">No Custom Slides Yet</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  The website is currently using the high-converting default Cyber Bunny hoodie showcase. Click &quot;Add Product Hoodie&quot; to customize your own drops!
                </p>
                <button
                  onClick={() => setIsAddSlideOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink text-white rounded-xl text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Slide
                </button>
              </div>
            ) : (
              slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                    slide.is_active
                      ? 'border-gray-200/90 shadow-sm hover:shadow-md'
                      : 'border-gray-200/60 opacity-60 bg-gray-50'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* Top status & actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          Drop #{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                            slide.is_active
                              ? 'bg-pink-soft text-pink border border-pink/20'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          {slide.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Modern Toggle Switch (Active / Disabled) */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={slide.is_active}
                          disabled={isPending}
                          onClick={() => handleToggleSlide(slide.id, slide.is_active)}
                          className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                            slide.is_active
                              ? 'bg-pink shadow-sm shadow-pink/30'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          title={
                            slide.is_active
                              ? 'Active on Hero (Click to Disable)'
                              : 'Disabled / Hidden (Click to Activate)'
                          }
                        >
                          <span className="sr-only">Toggle slide active status</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              slide.is_active ? 'translate-x-[22px]' : 'translate-x-0.5'
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => setEditingSlide(slide)}
                          className="p-1.5 text-gray-400 hover:text-pink hover:bg-pink-soft rounded-lg transition-colors"
                          title="Edit Slide"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="relative h-44 w-full bg-[#F1F1EF] rounded-xl overflow-hidden flex items-center justify-center p-3">
                      <Image
                        src={slide.image_url}
                        alt={slide.title || 'Hero Drop'}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>

                    {/* Title & Color Badge */}
                    <div>
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {slide.title || 'Hero Hoodie Product'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-pink bg-pink-soft px-2 py-0.5 rounded-full">
                          {slide.subtitle || 'Color / Variant'}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate">
                          {slide.button_link || '/shop'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Slide Modal */}
          {editingSlide && (
            <div className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="font-bold text-gray-900 text-base">Edit Product Slide</h4>
                  <button
                    onClick={() => setEditingSlide(null)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={editingSlide.title || ''}
                      onChange={(e) =>
                        setEditingSlide({ ...editingSlide, title: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Color / Switcher Tag
                    </label>
                    <input
                      type="text"
                      value={editingSlide.subtitle || ''}
                      onChange={(e) =>
                        setEditingSlide({ ...editingSlide, subtitle: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={editingSlide.button_link || ''}
                      onChange={(e) =>
                        setEditingSlide({ ...editingSlide, button_link: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    onClick={() => setEditingSlide(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditSlide}
                    disabled={isPending}
                    className="px-5 py-2 bg-pink hover:bg-pink-dark text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 3: FULL COMBINED HERO PREVIEW
         ══════════════════════════════════════════════════ */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/90 shadow-sm">
            <span className="text-xs font-bold text-gray-700">
              Interactive Hero Simulation
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-pink shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-pink shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Full Screen / Responsive Box */}
          <div
            className={`mx-auto transition-all duration-300 rounded-2xl overflow-hidden border border-gray-200/90 shadow-xl bg-[#F1F1EF] text-[#0B0D0E] relative ${
              previewDevice === 'mobile' ? 'max-w-[420px]' : 'w-full'
            }`}
          >
            {/* Background Splatter */}
            <div className="absolute inset-0 z-0 pointer-events-none w-full h-full opacity-60">
              <Image
                src="/images/hero/bg_heros.png"
                alt="Backdrop"
                fill
                className="object-cover object-center"
              />
            </div>

            <div className="relative z-10 p-6 sm:p-10 lg:p-12">
              <div
                className={`grid items-center gap-8 ${
                  previewDevice === 'mobile' ? 'grid-cols-1 text-center' : 'grid-cols-1 lg:grid-cols-12'
                }`}
              >
                {/* Left Copy */}
                <div
                  className={
                    previewDevice === 'mobile'
                      ? 'flex flex-col items-center'
                      : 'lg:col-span-6 flex flex-col items-start'
                  }
                >
                  <span className="text-[11px] font-bold tracking-[0.24em] uppercase text-gray-900 mb-2 inline-block">
                    {text.eyebrow || 'STREETWEAR'}
                  </span>

                  <h1 className="uppercase tracking-tight leading-none">
                    <span className="font-display font-black text-3xl sm:text-5xl block mb-1">
                      {text.headline_top || 'EXPRESS WHAT'}
                    </span>
                    <span className="font-display font-black text-[#F72585] text-3xl sm:text-5xl block transform -skew-x-6">
                      {text.headline_accent || 'MOVES YOU'}
                    </span>
                    <div className="w-[85%] mt-1">
                      <PinkBrushUnderline className="w-full h-3 text-[#F72585]" />
                    </div>
                  </h1>

                  <p className="mt-4 text-xs sm:text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-line max-w-[380px]">
                    {text.subtitle || 'Bold designs. Premium comfort.\nMore than clothes, it’s a mindset.'}
                  </p>

                  <div className="flex items-center gap-3 mt-6">
                    <div className="bg-[#F72585] text-white font-semibold text-xs px-5 py-2.5 rounded-[5px] shadow-sm">
                      {text.button_text || 'Shop Now'} →
                    </div>
                    <div className="bg-transparent text-gray-900 font-semibold text-xs px-4 py-2.5 rounded-[5px] border-[1.5px] border-gray-900">
                      {text.secondary_button_text || 'Explore Collections'} →
                    </div>
                  </div>
                </div>

                {/* Right Product Hoodie & Switcher */}
                <div
                  className={`relative flex flex-col items-center justify-center ${
                    previewDevice === 'mobile' ? 'mt-4' : 'lg:col-span-6'
                  }`}
                >
                  <div className="absolute top-0 right-[15%] z-10 transform rotate-12">
                    <PinkGraffitiCrown className="w-8 h-7 text-pink" />
                  </div>

                  {/* Main Product Image */}
                  <div className="relative w-full max-w-[260px] sm:max-w-[340px] aspect-[1319/1192] flex items-center justify-center">
                    <div className="absolute inset-4 bg-gradient-to-tr from-pink/20 to-cyan-400/20 rounded-full blur-xl pointer-events-none" />
                    <Image
                      src={currentPreviewProduct.image_url}
                      alt={currentPreviewProduct.title || 'Product'}
                      fill
                      unoptimized
                      className="object-contain drop-shadow-xl transition-all duration-300"
                    />
                  </div>

                  {/* Interactive Switcher Simulator */}
                  <div className="mt-4 inline-flex items-center gap-2 p-1.5 bg-white/95 backdrop-blur-md rounded-[5px] border border-black/10 shadow-lg">
                    {previewSlides.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => setPreviewSlideIdx(idx)}
                        className={`relative w-10 h-10 rounded-[5px] overflow-hidden transition-all flex items-center justify-center ${
                          previewSlideIdx === idx
                            ? 'border-2 border-pink ring-2 ring-pink/20 bg-pink-50/20'
                            : 'border border-gray-200 bg-gray-50 hover:border-gray-400'
                        }`}
                        title={item.title || item.subtitle}
                      >
                        <Image
                          src={item.image_url}
                          alt=""
                          fill
                          unoptimized
                          className="object-contain p-0.5"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
