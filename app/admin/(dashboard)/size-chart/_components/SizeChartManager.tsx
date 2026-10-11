'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  Loader2,
  Image as ImageIcon,
  Trash2,
  Save,
  X,
  AlertCircle,
  ZoomIn,
  Layers,
  CheckCircle2,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Star,
} from 'lucide-react'
import { ImageKitUploadWidget } from '@/components/ImageKitUploadWidget'
import {
  createOrUpdateLibraryChart,
  deleteSizeChart,
  getAllSizeCharts,
  setGlobalSizeChart,
} from '@/actions/size-charts'
import type { SizeChart } from '@/types/database'

interface SizeChartManagerProps {
  initialCharts?: SizeChart[]
}

export default function SizeChartManager({ initialCharts = [] }: SizeChartManagerProps) {
  const [charts, setCharts] = useState<SizeChart[]>(initialCharts)

  // Find global chart
  const globalChart = charts.find((c) => c.is_global)

  // Gallery seed helper, shared by the create/edit modal below. Reads the
  // saved chart's image_urls, falling back to the legacy single image_url.
  const seedImages = (chart?: SizeChart) => {
    if (!chart) return []
    const urls = chart.image_urls?.length ? chart.image_urls : chart.image_url ? [chart.image_url] : []
    const ids = chart.cloudinary_public_ids?.length ? chart.cloudinary_public_ids : chart.cloudinary_public_id ? [chart.cloudinary_public_id] : []
    return urls.map((url, i) => ({ url, publicId: ids[i] || null }))
  }

  // All image URLs for a saved chart row (falls back to the legacy single image).
  const chartImageUrls = (chart: SizeChart) => (chart.image_urls?.length ? chart.image_urls : [chart.image_url])

  // Lightbox, delete & "set as global" states
  const [zoomModal, setZoomModal] = useState<{ images: string[]; index: number; title: string } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [settingGlobalId, setSettingGlobalId] = useState<string | null>(null)

  const handleSetGlobal = async (id: string) => {
    setSettingGlobalId(id)
    const result = await setGlobalSizeChart(id)
    setSettingGlobalId(null)

    if (result.success) {
      const refresh = await getAllSizeCharts()
      if (refresh.success && refresh.data) {
        setCharts(refresh.data)
      }
      setFeedback({ type: 'success', message: 'This chart is now the storewide default.' })
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to set as global.' })
    }
  }

  // Library chart create/edit modal (null editorChart = creating a new one)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorChart, setEditorChart] = useState<SizeChart | null>(null)
  const [editorName, setEditorName] = useState('')
  const [editorActive, setEditorActive] = useState(true)
  const [editorImages, setEditorImages] = useState<{ url: string; publicId: string | null }[]>([])
  const [editorUploading, setEditorUploading] = useState(false)
  const [editorSaving, setEditorSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)

  const openCreateEditor = () => {
    setEditorChart(null)
    setEditorName('')
    setEditorActive(true)
    setEditorImages([])
    setEditorError(null)
    setIsEditorOpen(true)
  }

  const openEditEditor = (chart: SizeChart) => {
    setEditorChart(chart)
    setEditorName(chart.name)
    setEditorActive(chart.is_active)
    setEditorImages(seedImages(chart))
    setEditorError(null)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    if (editorSaving) return
    setIsEditorOpen(false)
  }

  const removeEditorImageAt = (index: number) => {
    setEditorImages((prev) => prev.filter((_, i) => i !== index))
  }

  const moveEditorImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1
    setEditorImages((prev) => {
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSaveLibraryChart = async () => {
    if (editorImages.length === 0) {
      setEditorError('Please upload at least one image.')
      return
    }
    setEditorSaving(true)
    setEditorError(null)

    const formData = new FormData()
    if (editorChart) formData.set('id', editorChart.id)
    formData.set('name', editorName.trim() || 'Custom Chart')
    formData.set('image_urls', JSON.stringify(editorImages.map((i) => i.url)))
    formData.set('cloudinary_public_ids', JSON.stringify(editorImages.map((i) => i.publicId || '')))
    if (editorActive) formData.set('is_active', 'on')

    const result = await createOrUpdateLibraryChart({}, formData)
    setEditorSaving(false)

    if (result.success) {
      const refresh = await getAllSizeCharts()
      if (refresh.success && refresh.data) {
        setCharts(refresh.data)
      }
      setFeedback({ type: 'success', message: editorChart ? 'Chart updated successfully!' : 'Chart created successfully!' })
      setIsEditorOpen(false)
    } else {
      setEditorError(result.error || 'Failed to save chart.')
    }
  }

  // Async action transitions
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (zoomModal || deleteConfirmId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [zoomModal, deleteConfirmId])

  // Clear feedback after 4s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Handle ESC / arrow keys for the zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomModal(null)
        setDeleteConfirmId(null)
      } else if (zoomModal && zoomModal.images.length > 1) {
        if (e.key === 'ArrowLeft') {
          setZoomModal((prev) =>
            prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : prev
          )
        } else if (e.key === 'ArrowRight') {
          setZoomModal((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : prev))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomModal])

  const confirmDelete = async (id: string) => {
    setIsDeleting(true)
    const result = await deleteSizeChart(id)
    setIsDeleting(false)

    if (result.success) {
      setCharts((prev) => prev.filter((c) => c.id !== id))
      setFeedback({ type: 'success', message: 'Size chart deleted successfully.' })
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to delete size chart.' })
    }
    setDeleteConfirmId(null)
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-panel p-3 sm:p-3.5 rounded-2xl border border-cream-line/70 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-gold/10 text-gold-light border border-gold/20">
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">
              Size Chart Library{' '}
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-cream-deep text-ink/70 border border-cream-line/60 align-middle ml-1">
                {charts.length}
              </span>
            </h2>
            <p className="text-[11px] text-ink/50">
              One chart is the storewide default — products can also pick any other chart by name.
            </p>
          </div>
        </div>

        {/* Status / Quick Notice */}
        <div className="flex items-center gap-3 px-1 text-xs text-ink/60 shrink-0">
          {globalChart?.is_active ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {globalChart.name} is live as default
            </span>
          ) : globalChart ? (
            <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Default chart is inactive
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              No default chart set
            </span>
          )}
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
              : 'bg-red-500/10 border-red-500/30 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">All Stored Size Charts</h2>
            <p className="text-[11px] text-ink/50">
              Click the star on any chart to make it the storewide default.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateEditor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-ink text-cream hover:bg-ink/90 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Chart
          </button>
        </div>

        {charts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-cream-line bg-panel/40 space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto text-ink/30" />
            <p className="text-xs font-semibold text-ink/70">No size charts created yet</p>
            <p className="text-[11px] text-ink/40">
              Click "Create New Chart" above to add your first one — the first chart you create automatically becomes
              the storewide default.
            </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {charts.map((chart) => (
                <div
                  key={chart.id}
                  className="bg-panel rounded-2xl border border-cream-line/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => setZoomModal({ images: chartImageUrls(chart), index: 0, title: chart.name })}
                    className="relative aspect-[16/10] bg-cream-deep/60 border-b border-cream-line/60 overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={chart.image_url}
                      alt={chart.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      {chart.is_global ? (
                        <span className="px-2 py-0.5 bg-gold text-white text-[10px] font-bold rounded-md shadow-sm">
                          Global
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-ink/70 text-cream text-[10px] font-semibold rounded-md shadow-sm">
                          Custom
                        </span>
                      )}
                      <span
                        className={`w-2 h-2 rounded-full shadow-sm ${
                          chart.is_active ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                        title={chart.is_active ? 'Active' : 'Inactive'}
                      />
                    </div>

                    {/* Zoom Icon Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ZoomIn className="w-5 h-5" />
                    </div>

                    {/* Image count badge — this card only previews the first image */}
                    {(chart.image_urls?.length || 0) > 1 && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded-md shadow-sm flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {chart.image_urls!.length} Photos
                      </div>
                    )}
                  </div>

                  {/* Body & Actions */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2 text-xs">
                    <div>
                      <h3 className="font-bold text-ink truncate" title={chart.name}>
                        {chart.name}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-ink/50 mt-1">
                        <span>{chart.is_active ? 'Active' : 'Inactive'}</span>
                        <span>{new Date(chart.updated_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-cream-line/50">
                      <button
                        type="button"
                        onClick={() =>
                          setZoomModal({ images: chartImageUrls(chart), index: 0, title: chart.name })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/70 hover:text-ink transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditEditor(chart)}
                          className="p-1.5 text-ink/40 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
                          title="Edit size chart"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {chart.is_global ? (
                          <span
                            className="p-1.5 text-gold"
                            title="This is the storewide default chart"
                          >
                            <Star className="w-3.5 h-3.5 fill-gold" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetGlobal(chart.id)}
                            disabled={settingGlobalId === chart.id}
                            className="p-1.5 text-ink/40 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Set as storewide default"
                          >
                            {settingGlobalId === chart.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Star className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {!chart.is_global && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(chart.id)}
                            className="p-1.5 text-ink/40 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete size chart"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* LIGHTBOX / ZOOM MODAL */}
      {zoomModal && isMounted && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setZoomModal(null)}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-white/55 p-1.5 sm:p-4 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-panel rounded-2xl border border-black shadow-2xl max-w-3xl w-full max-h-[97vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-cream-line/70">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-bold text-ink">
                  {zoomModal.title}
                  {zoomModal.images.length > 1 && (
                    <span className="text-ink/40 font-normal ml-1.5">
                      ({zoomModal.index + 1}/{zoomModal.images.length})
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setZoomModal(null)}
                className="p-1.5 text-ink/50 hover:text-ink hover:bg-cream-deep rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Box */}
            <div className="relative flex-1 min-h-[420px] sm:min-h-[460px] max-h-[85vh] sm:max-h-[75vh] bg-cream-deep/40 p-1.5 sm:p-4 flex items-center justify-center overflow-auto">
              <div className="relative w-full h-full min-h-[400px] sm:min-h-[440px]">
                <Image
                  key={zoomModal.images[zoomModal.index]}
                  src={zoomModal.images[zoomModal.index]}
                  alt={zoomModal.title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {/* Prev / Next */}
              {zoomModal.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setZoomModal((prev) =>
                        prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : prev
                      )
                    }}
                    className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/25 hover:bg-black/55 text-white shadow-sm transition-colors"
                    title="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setZoomModal((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : prev))
                    }}
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/25 hover:bg-black/55 text-white shadow-sm transition-colors"
                    title="Next image"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                    {zoomModal.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setZoomModal((prev) => (prev ? { ...prev, index: idx } : prev))
                        }}
                        className={`rounded-full transition-all cursor-pointer ${
                          idx === zoomModal.index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-cream-deep/40 border-t border-cream-line/60 text-[11px] sm:text-xs text-ink/60">
              <span className="hidden sm:inline">
                Press ESC or click outside to close{zoomModal.images.length > 1 ? ' • ← → to navigate' : ''}
              </span>
              <span className="sm:hidden">Tap outside to close</span>
              <a
                href={zoomModal.images[zoomModal.index]}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold-light hover:underline shrink-0"
              >
                Open Original
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && isMounted && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setDeleteConfirmId(null)}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-panel rounded-2xl border border-cream-line/80 p-5 w-full max-w-sm space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-500/10 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Delete Size Chart?</h3>
                <p className="text-xs text-ink/60 mt-0.5">
                  This action is permanent and cannot be reversed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-cream-line/60">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-ink/70 hover:text-ink bg-cream-deep hover:bg-panel2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE / EDIT LIBRARY CHART MODAL */}
      {isEditorOpen && isMounted && typeof document !== 'undefined' && createPortal(
        <div
          onClick={closeEditor}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-md animate-fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-panel rounded-2xl border border-cream-line/80 w-full max-w-lg my-auto shadow-2xl flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-line/70 shrink-0">
              <h3 className="text-sm font-bold text-ink">
                {editorChart ? 'Edit Chart' : 'Create New Chart'}
              </h3>
              <button
                type="button"
                onClick={closeEditor}
                disabled={editorSaving}
                className="p-1.5 text-ink/40 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              {editorError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {editorError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ink/70 uppercase tracking-wider mb-1.5">
                  Chart Name
                </label>
                <input
                  type="text"
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  placeholder="e.g. Oversized Tees Chart"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-cream-line bg-white text-ink focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/70 uppercase tracking-wider mb-1.5">
                  Chart Images
                </label>

                {editorImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2.5">
                    {editorImages.map((img, idx) => (
                      <div
                        key={`${img.url}-${idx}`}
                        className="group relative w-full aspect-[210/297] rounded-xl border border-cream-line overflow-hidden bg-cream-deep/60"
                      >
                        <Image src={img.url} alt={`Chart image #${idx + 1}`} fill className="object-cover" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold pointer-events-none">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEditorImageAt(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-red-600/90 hover:bg-red-600 text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => moveEditorImage(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors disabled:opacity-0 disabled:pointer-events-none"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveEditorImage(idx, 'right')}
                            disabled={idx === editorImages.length - 1}
                            className="p-1 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors disabled:opacity-0 disabled:pointer-events-none"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <ImageKitUploadWidget
                  options={{
                    maxFiles: 1,
                    folder: 'teenzos/size-charts',
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                  }}
                  onSuccess={(result: any) => {
                    const url = result.url || result.info?.secure_url
                    const fileId = result.fileId || result.info?.public_id
                    setEditorImages((prev) => [...prev, { url, publicId: fileId || null }])
                    setEditorUploading(false)
                  }}
                  onOpen={() => setEditorUploading(true)}
                  onError={() => setEditorUploading(false)}
                  onClose={() => setEditorUploading(false)}
                >
                  {({ open, isUploading: widgetUploading }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      disabled={editorUploading || widgetUploading}
                      className="w-full h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cream-line bg-cream-deep/40 text-ink/60 hover:border-gold hover:text-gold transition-all disabled:opacity-50"
                    >
                      {editorUploading || widgetUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gold" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span className="text-xs font-semibold">
                        {editorImages.length === 0 ? 'Upload Image' : 'Add Another Image'}
                      </span>
                    </button>
                  )}
                </ImageKitUploadWidget>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl border border-cream-line/80 bg-cream-deep/30 cursor-pointer">
                <span className="text-xs font-semibold text-ink/80">Active</span>
                <input
                  type="checkbox"
                  checked={editorActive}
                  onChange={(e) => setEditorActive(e.target.checked)}
                  className="w-4 h-4 text-gold focus:ring-gold/30"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-cream-line/70 shrink-0">
              <button
                type="button"
                onClick={closeEditor}
                disabled={editorSaving}
                className="px-3.5 py-2 text-xs font-semibold text-ink/70 hover:text-ink bg-cream-deep hover:bg-panel2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLibraryChart}
                disabled={editorSaving}
                className="px-4 py-2 text-xs font-bold text-white bg-ink hover:bg-ink/90 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {editorSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editorChart ? 'Save Changes' : 'Create Chart'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}