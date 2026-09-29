'use client'

import { useState, useTransition, useActionState, useId } from 'react'
import { createCategory, updateCategory, type ActionResult } from '@/actions/categories'
import Link from 'next/link'
import Image from 'next/image'
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  X,
  Sparkles,
  Link2,
  CheckCircle2,
  Eye,
  EyeOff,
  UploadCloud,
  ArrowUpRight,
  FolderTree,
} from 'lucide-react'
import { ImageKitUploadWidget } from '@/components/ImageKitUploadWidget'
import type { Category } from '@/types/database'

interface CategoryFormProps {
  category?: Category
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const isEditing = !!category
  const action = isEditing ? updateCategory : createCategory

  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url || null)
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [isUploading, setIsUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [customUrl, setCustomUrl] = useState('')

  const [state, formAction] = useActionState<ActionResult, FormData>(action, {})
  const [pending, startTransition] = useTransition()

  const currentSlug = slugify(name) || (category?.slug || 'category-slug')

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      setImageUrl(customUrl.trim())
      setCustomUrl('')
      setShowUrlInput(false)
    }
  }

  return (
    <form
      action={(formData) => startTransition(() => formAction(formData))}
      className="space-y-5"
    >
      {/* Hidden ID for edit */}
      {isEditing && <input type="hidden" name="id" value={category.id} />}

      {/* Hidden Image URL input for submission */}
      <input type="hidden" name="image_url" value={imageUrl || ''} />

      {/* Error Banner */}
      {state?.error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Main Responsive Grid: 7 cols main details + 5 cols media & preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        
        {/* ========================================================
            LEFT COLUMN (Details & Status)
        ======================================================== */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          
          {/* General Information Card */}
          <div className="bg-panel rounded-2xl border border-cream-line p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-line/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F72585]/10 text-[#F72585] flex items-center justify-center font-bold">
                  <FolderTree className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-ink">Category Details</h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cream-deep text-ink/60">
                {isEditing ? 'ID: ' + category.id : 'New Item'}
              </span>
            </div>

            {/* Category Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="category-name"
                  className="text-xs sm:text-sm font-semibold text-ink"
                >
                  Category Name <span className="text-[#F72585]">*</span>
                </label>
                <span className="text-[11px] text-ink/40 font-mono">
                  {name.length}/100
                </span>
              </div>
              <input
                id="category-name"
                name="name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oversized Hoodies, Graphic Tees"
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-line bg-panel2/50 text-ink text-sm placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-[#F72585]/30 focus:border-[#F72585] transition-all duration-200"
              />

              {/* Dynamic Live Slug Pill */}
              <div className="mt-2 flex items-center flex-wrap gap-1.5 text-[11px] text-ink/50 bg-cream-deep/70 px-2.5 py-1.5 rounded-lg border border-cream-line/50">
                <Link2 className="w-3 h-3 text-[#F72585] shrink-0" />
                <span className="font-medium text-ink/60">Slug Preview:</span>
                <span className="font-mono text-[#F72585] font-semibold break-all">
                  /shop?category={currentSlug}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="category-description"
                  className="text-xs sm:text-sm font-semibold text-ink"
                >
                  Description <span className="text-[11px] font-normal text-ink/40">(Optional)</span>
                </label>
                <span className="text-[11px] text-ink/40 font-mono">
                  {description.length}/1000
                </span>
              </div>
              <textarea
                id="category-description"
                name="description"
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short tagline or collection summary shown to customers..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-line bg-panel2/50 text-ink text-sm placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-[#F72585]/30 focus:border-[#F72585] transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Visibility / Active Status Toggle Card */}
          <div className="bg-panel rounded-2xl border border-cream-line p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-ink">
                    Storefront Visibility
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                        : 'bg-stone-500/15 text-stone-500 border border-stone-500/20'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Eye className="w-2.5 h-2.5" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-2.5 h-2.5" />
                        Hidden
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-ink/55 leading-relaxed">
                  {isActive
                    ? 'Visible in navigation menus, search filters, and collection carousels.'
                    : 'Hidden from customer storefront, but preserved in admin catalog.'}
                </p>
              </div>

              {/* iOS-Style Modern Toggle Switch */}
              <label
                htmlFor="category-active"
                className="relative inline-flex items-center cursor-pointer select-none shrink-0"
              >
                <input
                  id="category-active"
                  name="is_active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#F72585]/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[3px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F72585]" />
              </label>
            </div>
          </div>

        </div>

        {/* ========================================================
            RIGHT COLUMN (Media & Live Preview)
        ======================================================== */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          
          {/* Image Upload Card */}
          <div className="bg-panel rounded-2xl border border-cream-line p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-cream-line/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#36B8C5]/10 text-[#0891B2] flex items-center justify-center font-bold">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-ink">Category Image</h2>
              </div>
              <span className="text-[11px] text-ink/40">4:5 or 1:1</span>
            </div>

            {imageUrl ? (
              /* Image Uploaded State */
              <div className="space-y-3">
                <div className="relative w-full aspect-[16/10] sm:aspect-video rounded-xl border border-cream-line overflow-hidden bg-stone-950 group">
                  <Image
                    src={imageUrl}
                    alt={name || 'Category Image Preview'}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  {/* Floating Action Buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      title="Remove image"
                      className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg shadow-sm backdrop-blur-md transition-all duration-150"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] z-10">
                    <span className="inline-flex items-center gap-1 font-medium bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Image Ready
                    </span>
                    <ImageKitUploadWidget
                      options={{
                        maxFiles: 1,
                        folder: 'rawflex/categories',
                        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                      }}
                      onSuccess={(result) => {
                        setImageUrl(result.url)
                        setIsUploading(false)
                      }}
                      onOpen={() => setIsUploading(true)}
                      onError={() => setIsUploading(false)}
                      onClose={() => setIsUploading(false)}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          disabled={isUploading || pending}
                          className="px-2.5 py-1 bg-white/90 hover:bg-white text-[#0B0D0E] font-semibold rounded-md shadow-sm backdrop-blur-sm transition-all text-[11px]"
                        >
                          Change
                        </button>
                      )}
                    </ImageKitUploadWidget>
                  </div>
                </div>
              </div>
            ) : (
              /* Image Empty Dropzone */
              <div className="space-y-2.5">
                <ImageKitUploadWidget
                  options={{
                    maxFiles: 1,
                    folder: 'rawflex/categories',
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                  }}
                  onSuccess={(result) => {
                    setImageUrl(result.url)
                    setIsUploading(false)
                  }}
                  onOpen={() => setIsUploading(true)}
                  onError={() => setIsUploading(false)}
                  onClose={() => setIsUploading(false)}
                >
                  {({ open, isUploading: widgetUploading }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      disabled={isUploading || widgetUploading || pending}
                      className="w-full py-6 px-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-line bg-cream-deep/60 hover:bg-panel2 hover:border-[#F72585]/60 text-ink/60 hover:text-[#F72585] transition-all duration-200 group cursor-pointer disabled:opacity-50"
                    >
                      {isUploading || widgetUploading ? (
                        <Loader2 className="w-7 h-7 animate-spin text-[#F72585]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-panel shadow-xs flex items-center justify-center text-ink/60 group-hover:text-[#F72585] group-hover:scale-110 transition-all duration-200">
                          <UploadCloud className="w-5 h-5 stroke-[2]" />
                        </div>
                      )}
                      <div className="text-center">
                        <span className="text-xs sm:text-sm font-semibold block text-ink group-hover:text-[#F72585] transition-colors">
                          Click to upload category image
                        </span>
                        <span className="text-[11px] text-ink/40 block mt-0.5">
                          WebP, PNG, JPG (recommended 4:5 or 1:1)
                        </span>
                      </div>
                    </button>
                  )}
                </ImageKitUploadWidget>

                {/* Direct URL toggle */}
                {!showUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="text-[11px] text-ink/40 hover:text-[#F72585] transition-colors inline-flex items-center gap-1 font-medium"
                  >
                    <Link2 className="w-3 h-3" />
                    Or paste image URL directly
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <input
                      type="url"
                      placeholder="https://example.com/category.jpg"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-cream-line bg-panel2/50 text-ink focus:outline-none focus:ring-1 focus:ring-[#F72585]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-2.5 py-1.5 bg-[#F72585] text-white rounded-lg text-xs font-semibold hover:bg-[#F72585]/90 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="p-1.5 text-ink/40 hover:text-ink"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Storefront Mini-Card Preview */}
          <div className="bg-panel rounded-2xl border border-cream-line p-4 sm:p-5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-cream-line/60">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F72585]" />
                <span className="text-xs font-bold text-ink">Storefront Card Preview</span>
              </div>
              <span className="text-[10px] text-ink/40 font-mono">Live Simulation</span>
            </div>

            {/* TeenZos Collection Card Mockup */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-900 border border-black/10 shadow-sm">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name || 'Category Preview'}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 bg-stone-900 p-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
                  <span className="text-[11px] font-medium">Default collection placeholder</span>
                </div>
              )}

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Bottom Card Meta */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 flex items-end justify-between gap-2 z-10">
                <div className="min-w-0 pr-2">
                  <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wide truncate">
                    {name || 'CATEGORY TITLE'}
                  </h3>
                  <p className="text-white/70 text-[10px] sm:text-[11px] font-normal truncate mt-0.5">
                    {description || 'Explore Collection'}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/95 text-[#0B0D0E] flex items-center justify-center shrink-0 shadow-sm">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================
          BOTTOM ACTIONS BAR (Sleek, Compact & Responsive)
      ======================================================== */}
      <div className="sticky bottom-3 z-20 bg-panel/95 backdrop-blur-md rounded-2xl border border-cream-line/80 p-3 sm:p-4 shadow-lg flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <Link
          href="/admin/categories"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-ink/70 hover:text-ink hover:bg-cream-deep/80 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel & Back
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="admin-primary-action px-6 py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all shadow-md active:scale-98 disabled:opacity-60 cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Category' : 'Create Category'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
