'use client'

import { useMemo, useRef, useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  Package,
  Search,
  Settings2,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react'
import { VideoUploadButton } from '@/components/admin/VideoUploadButton'
import {
  createShoppableVideo,
  deleteShoppableVideo,
  moveShoppableVideo,
  toggleShoppableVideo,
  updateShoppableVideo,
  updateVideoSectionSettings,
  type AdminShoppableVideo,
  type ProductOption,
} from '@/actions/admin/shoppableVideos'
import { MAX_SHOPPABLE_VIDEOS, type VideoSectionSettings } from '@/lib/shoppableVideos'

// ── helpers ───────────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 text-sm rounded-xl border border-cream-line bg-cream-deep text-ink focus:outline-none focus:ring-1 focus:ring-pink focus:border-pink transition-all'

// Cap how many rows the product dropdown renders at once — with a large
// catalog, listing everything makes the list slow to scroll and hard to
// scan. Typing narrows it down like any search.
const MAX_VISIBLE_PRODUCTS = 40

// ── Searchable Product Picker ─────────────────────────────────────────────────

function ProductSearchSelect({
  products,
  value,
  onChange,
  placeholder = 'Search products…',
}: {
  products: ProductOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = products.find((p) => p.id === value)

  useEffect(() => { setMounted(true) }, [])

  const updateCoords = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setCoords({ top: rect.bottom + 8, left: rect.left, width: rect.width })
  }

  // Keep the portal glued to the trigger while open (scroll / resize can move it)
  useEffect(() => {
    if (!open) return
    updateCoords()
    const onScrollOrResize = () => updateCoords()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open])

  // Close when clicking outside (trigger AND the portaled dropdown)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
      setQuery('')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = useMemo(
    () =>
      query.trim()
        ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        : products,
    [query, products]
  )
  const visible = filtered.slice(0, MAX_VISIBLE_PRODUCTS)
  const hiddenCount = filtered.length - visible.length

  const openDropdown = () => {
    updateCoords()
    setOpen(true)
    inputRef.current?.focus()
  }

  const close = (keepValue = false) => {
    setOpen(false)
    if (!keepValue) setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center gap-2 border border-cream-line rounded-xl bg-cream-deep px-3 py-2.5 cursor-text focus-within:ring-1 focus-within:ring-pink focus-within:border-pink transition-all"
        onClick={openDropdown}
      >
        <Search className="w-4 h-4 text-ink/40 shrink-0" />
        <input
          ref={inputRef}
          value={open ? query : selected?.name || ''}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); updateCoords() }}
          onFocus={openDropdown}
          placeholder={placeholder}
          className="flex-1 !bg-transparent text-sm text-ink focus:outline-none min-w-0"
          readOnly={!open}
        />
        {value ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setQuery(''); close() }}
            className="p-0.5 text-ink/40 hover:text-ink rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className={`w-4 h-4 text-ink/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Portal straight to <body> with fixed positioning — escapes every local
          stacking context on the page, so it can never render behind a sibling. */}
      {mounted && open && coords && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-panel border border-cream-line rounded-xl shadow-2xl shadow-black/10 max-h-64 overflow-y-auto divide-y divide-cream-line/70 animate-fade-in"
          style={{ top: coords.top, left: coords.left, width: coords.width, zIndex: 2147483647 }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Package className="w-5 h-5 text-ink/20 mx-auto mb-1.5" />
              <p className="text-sm text-ink/40">No products found</p>
            </div>
          ) : (
            <>
              {hiddenCount > 0 && (
                <div className="sticky top-0 px-4 py-2 text-[11px] font-semibold text-ink/40 bg-cream-deep/95 backdrop-blur-sm">
                  Showing {visible.length} of {filtered.length} — keep typing to narrow down
                </div>
              )}
              {visible.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => {
                  // mousedown fires before blur, so we use it to prevent the input losing focus before we register the click
                  e.preventDefault()
                  onChange(p.id)
                  close(true)
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2.5 ${
                  value === p.id ? 'bg-pink-soft text-pink font-semibold' : 'text-ink/80 hover:bg-cream-deep'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 shrink-0 rounded-full transition-colors ${
                    value === p.id ? 'bg-pink text-white' : ''
                  }`}
                >
                  {value === p.id && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                </span>
                <span className="truncate">{p.name}</span>
                {p.price != null && (
                  <span className={`ml-auto text-xs shrink-0 ${value === p.id ? 'text-pink/70' : 'text-ink/40'}`}>
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </span>
                )}
              </button>
              ))}
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function VideoSectionManager({
  initialVideos,
  products,
  initialSettings,
}: {
  initialVideos: AdminShoppableVideo[]
  products: ProductOption[]
  initialSettings: VideoSectionSettings
}) {
  const router = useRouter()
  const [videos, setVideos] = useState(initialVideos)
  const [settings, setSettings] = useState(initialSettings)

  // ── Add Video form state ──
  const [newProductId, setNewProductId] = useState('')
  const [newTitle, setNewTitle] = useState('')

  // ── Existing video drafts ──
  const [drafts, setDrafts] = useState<
    Record<string, { title: string; productId: string }>
  >(
    Object.fromEntries(
      initialVideos.map((v) => [
        v.id,
        { title: v.title || '', productId: v.product_id || '' },
      ])
    )
  )

  const [isPending, startTransition] = useTransition()
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Video preview modal ──
  const [previewVideo, setPreviewVideo] = useState<{
    url: string
    poster: string | null
    title: string
  } | null>(null)

  useEffect(() => {
    if (!previewVideo) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewVideo(null)
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [previewVideo])

  const run = (action: () => Promise<{ success: boolean; error?: string }>, onDone?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await action()
      if (res.success === false) {
        setError(res.error || 'Something went wrong.')
        return
      }
      onDone?.()
    })
  }

  const handleUploaded = (result: { url: string; posterUrl: string }) => {
    run(
      () =>
        createShoppableVideo({
          videoUrl: result.url,
          posterUrl: result.posterUrl,
          externalUrl: null,
          title: newTitle,
          productId: newProductId || null,
        }),
      () => {
        setNewTitle('')
        setNewProductId('')
        router.refresh()
        window.location.reload()
      }
    )
  }

  const saveSettings = () => {
    setSettingsSaved(false)
    run(
      () => updateVideoSectionSettings({ ...settings }),
      () => {
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 2500)
      }
    )
  }

  const saveVideo = (id: string) => {
    const draft = drafts[id]
    if (!draft) return
    run(
      () => updateShoppableVideo(id, { title: draft.title, productId: draft.productId || null }),
      () => {
        const product = products.find((p) => p.id === draft.productId) || null
        setVideos((prev) =>
          prev.map((v) =>
            v.id === id
              ? { ...v, title: draft.title || null, product_id: draft.productId || null, product }
              : v
          )
        )
      }
    )
  }

  const toggle = (video: AdminShoppableVideo) =>
    run(
      () => toggleShoppableVideo(video.id, !video.is_active),
      () => setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, is_active: !video.is_active } : v)))
    )

  const move = (id: string, direction: 'up' | 'down') =>
    run(
      () => moveShoppableVideo(id, direction),
      () => {
        setVideos((prev) => {
          const index = prev.findIndex((v) => v.id === id)
          const target = direction === 'up' ? index - 1 : index + 1
          if (index === -1 || target < 0 || target >= prev.length) return prev
          const next = [...prev]
          ;[next[index], next[target]] = [next[target], next[index]]
          return next
        })
      }
    )

  const remove = (id: string) => {
    if (!confirm('Delete this video from the homepage section?')) return
    run(
      () => deleteShoppableVideo(id),
      () => setVideos((prev) => prev.filter((v) => v.id !== id))
    )
  }

  const liveCount = videos.filter((v) => v.is_active && v.product_id).length

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Section Settings ──────────────────────────────────────────── */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-ink/40" />
          <h2 className="text-base font-bold text-ink">Section Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1.5">
              Heading <span className="font-normal normal-case text-ink/40">(optional)</span>
            </label>
            <input
              className={inputClass}
              maxLength={80}
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="e.g. Shop the Look"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1.5">
              Sub-heading <span className="font-normal normal-case text-ink/40">(optional)</span>
            </label>
            <input
              className={inputClass}
              maxLength={200}
              value={settings.subtitle}
              onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              placeholder="e.g. Watch it, love it, wear it."
            />
          </div>
        </div>

        {/* Instagram Follow button URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1.5">
            Instagram Profile URL{' '}
            <span className="font-normal normal-case text-ink/40">(shows a Follow button below the videos)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </span>
            <input
              className={`${inputClass} pl-9`}
              maxLength={200}
              value={settings.instagramUrl}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              placeholder="https://www.instagram.com/teenzosstore"
              type="url"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">
            Position on homepage
          </label>
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
            {(
              [
                ['before_products', 'Before products'],
                ['after_products', 'After products'],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex items-center justify-center sm:justify-start gap-2 px-2.5 sm:px-4 py-2.5 sm:py-2 rounded-xl border cursor-pointer text-xs sm:text-sm font-semibold text-center whitespace-nowrap transition-all ${
                  settings.placement === value
                    ? 'border-ink bg-ink text-white'
                    : 'border-cream-line text-ink/60 hover:bg-cream-deep'
                }`}
              >
                <input
                  type="radio"
                  name="placement"
                  checked={settings.placement === value}
                  onChange={() => setSettings({ ...settings, placement: value })}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-pink text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {settingsSaved ? <Check className="w-4 h-4" /> : null}
          {settingsSaved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* ── Add Video ─────────────────────────────────────────────────── */}
      <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-ink/40" />
            <h2 className="text-base font-bold text-ink">Add Video</h2>
          </div>
          <span className="text-xs text-ink/40 font-medium">
            {liveCount} / {MAX_SHOPPABLE_VIDEOS} live
          </span>
        </div>

        <p className="text-sm text-ink/50">
          MP4 / WebM / MOV — max <span className="font-bold text-ink">50 MB</span> per video. Short vertical clips (9:16) work best.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1.5">
              Mapped product <span className="text-pink">*</span>
            </label>
            <ProductSearchSelect
              products={products}
              value={newProductId}
              onChange={setNewProductId}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1.5">
              Caption <span className="font-normal normal-case text-ink/40">(optional)</span>
            </label>
            <input
              className={inputClass}
              maxLength={80}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Shown on the video card"
            />
          </div>
        </div>

        {videos.length >= MAX_SHOPPABLE_VIDEOS ? (
          <span className="block text-sm font-medium text-orange-600 bg-orange-50 px-3 py-2 rounded-xl border border-orange-200">
            Maximum {MAX_SHOPPABLE_VIDEOS} videos reached — delete one to add more
          </span>
        ) : (
          <VideoUploadButton onSuccess={handleUploaded}>
            {({ open, isUploading, progress }) => (
              <button
                type="button"
                onClick={() => {
                  if (!newProductId) { setError('Select the product first.'); return }
                  setError(null)
                  open()
                }}
                disabled={isUploading || isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-pink text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
              >
                {isUploading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4" />}
                {isUploading ? `Uploading ${progress}%…` : 'Upload Video'}
              </button>
            )}
          </VideoUploadButton>
        )}
      </div>

      {/* ── Existing Videos ───────────────────────────────────────────── */}
      {videos.length === 0 ? (
        <div className="text-center py-10 sm:py-14 px-4 border-2 border-dashed border-cream-line rounded-2xl bg-cream-deep">
          <Video className="w-8 h-8 text-ink/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink/60">No videos yet</p>
          <p className="text-xs text-ink/40 mt-1">Upload a video above to show this section on the homepage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-ink/40 uppercase tracking-wider px-1">
            {videos.length} video{videos.length !== 1 ? 's' : ''} &mdash; {liveCount} live
          </p>

          {videos.map((video, index) => {
            const draft = drafts[video.id] || { title: '', productId: '' }
            const dirty = draft.title !== (video.title || '') || draft.productId !== (video.product_id || '')

            return (
              <div
                key={video.id}
                className={`rounded-2xl border bg-panel transition-opacity ${
                  video.is_active ? 'border-cream-line' : 'border-cream-line/40 opacity-55'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-2 px-3 sm:px-4 py-3 border-b border-cream-line/60">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-ink/40 shrink-0">#{index + 1}</span>
                    {video.product ? (
                      <span className="text-sm font-semibold text-ink truncate">{video.product.name}</span>
                    ) : (
                      <span className="text-xs text-orange-600 flex items-center gap-1 shrink-0">
                        <Package className="w-3 h-3" /> No product mapped
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    {/* Live toggle */}
                    <label className="relative inline-flex items-center cursor-pointer select-none" title="Toggle live">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={video.is_active}
                        onChange={() => toggle(video)}
                        disabled={isPending}
                      />
                      <div className="w-10 h-5 bg-cream-line rounded-full peer peer-checked:bg-emerald-500 peer-disabled:opacity-50 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
                    </label>
                    <span className={`text-xs font-semibold w-6 ${video.is_active ? 'text-emerald-600' : 'text-ink/30'}`}>
                      {video.is_active ? 'On' : 'Off'}
                    </span>

                    <span className="w-px h-4 bg-cream-line mx-0.5 sm:mx-1" />

                    <button
                      type="button"
                      onClick={() => move(video.id, 'up')}
                      disabled={isPending || index === 0}
                      className="p-2 sm:p-1.5 text-ink/40 hover:text-ink hover:bg-cream-deep rounded-lg disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(video.id, 'down')}
                      disabled={isPending || index === videos.length - 1}
                      className="p-2 sm:p-1.5 text-ink/40 hover:text-ink hover:bg-cream-deep rounded-lg disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(video.id)}
                      disabled={isPending}
                      className="p-2 sm:p-1.5 text-ink/30 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body — preview + edit */}
                <div className="flex flex-row gap-3 sm:gap-4 p-3 sm:p-4">
                  {/* Video thumbnail */}
                  <div className="w-20 sm:w-24 shrink-0">
                    <div className="aspect-[9/16] rounded-xl overflow-hidden bg-black">
                      <video
                        src={video.video_url ?? undefined}
                        poster={video.poster_url || undefined}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        controls
                      />
                    </div>
                  </div>

                  {/* Edit fields */}
                  <div className="relative z-20 flex-1 min-w-0 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-1.5">
                        Mapped product
                      </label>
                      <ProductSearchSelect
                        products={products}
                        value={draft.productId}
                        onChange={(id) =>
                          setDrafts({ ...drafts, [video.id]: { ...draft, productId: id } })
                        }
                        placeholder="Search & select product…"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-1.5">
                        Caption <span className="font-normal normal-case">(optional)</span>
                      </label>
                      <input
                        className={`${inputClass} text-xs`}
                        maxLength={80}
                        value={draft.title}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [video.id]: { ...draft, title: e.target.value } })
                        }
                        placeholder="Optional caption shown on the video"
                      />
                    </div>

                    {video.video_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewVideo({
                            url: video.video_url!,
                            poster: video.poster_url,
                            title: video.product?.name || video.title || `Video #${index + 1}`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs text-ink/40 hover:text-pink transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" /> View uploaded file
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => saveVideo(video.id)}
                      disabled={!dirty || isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-pink text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isPending && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-50 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving…
        </div>
      )}

      {/* Video preview modal — bigger player on larger screens instead of a raw new-tab link */}
      {previewVideo && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-8 bg-black/75 backdrop-blur-sm animate-fade-in"
          style={{ zIndex: 2147483647 }}
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="relative w-full max-w-xs sm:max-w-sm md:max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewVideo(null)}
              className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <video
              src={previewVideo.url}
              poster={previewVideo.poster || undefined}
              className="w-full max-h-[75vh] aspect-[9/16] object-contain bg-black"
              controls
              autoPlay
              playsInline
            />
            <div className="px-4 py-2.5 bg-black text-white text-xs font-semibold truncate">
              {previewVideo.title}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
