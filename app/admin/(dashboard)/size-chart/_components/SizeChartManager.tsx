'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  Loader2,
  Image as ImageIcon,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  ZoomIn,
  UploadCloud,
  Globe,
  Layers,
  CheckCircle2,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { ImageKitUploadWidget } from '@/components/ImageKitUploadWidget'
import {
  createOrUpdateGlobalSizeChart,
  deleteSizeChart,
  getAllSizeCharts,
} from '@/actions/size-charts'
import type { SizeChart } from '@/types/database'

interface SizeChartManagerProps {
  initialCharts?: SizeChart[]
}

export default function SizeChartManager({ initialCharts = [] }: SizeChartManagerProps) {
  const [charts, setCharts] = useState<SizeChart[]>(initialCharts)
  const [activeTab, setActiveTab] = useState<'global' | 'list'>('global')

  // Find global chart
  const globalChart = charts.find((c) => c.is_global)

  // Form states for Global Chart
  const [chartName, setChartName] = useState(globalChart?.name || 'Global Size Chart')
  const [isActive, setIsActive] = useState(globalChart ? globalChart.is_active : true)
  const [stagedImageUrl, setStagedImageUrl] = useState<string | null>(null)
  const [stagedPublicId, setStagedPublicId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Lightbox & Delete states
  const [zoomModalUrl, setZoomModalUrl] = useState<{ url: string; title: string } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Async action transitions
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (zoomModalUrl || deleteConfirmId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [zoomModalUrl, deleteConfirmId])

  // Sync form when globalChart changes
  useEffect(() => {
    if (globalChart) {
      setChartName(globalChart.name)
      setIsActive(globalChart.is_active)
    }
  }, [globalChart])

  // Clear feedback after 4s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomModalUrl(null)
        setDeleteConfirmId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleUploadSuccess = (result: any) => {
    const url = result.url || result.info?.secure_url
    const fileId = result.fileId || result.info?.public_id
    setStagedImageUrl(url)
    setStagedPublicId(fileId)
    setIsUploading(false)
    setFeedback({ type: 'success', message: 'New size chart image uploaded. Click Save to apply.' })
  }

  const handleTabChange = async (tab: 'global' | 'list') => {
    setActiveTab(tab)
    if (tab === 'list') {
      const result = await getAllSizeCharts()
      if (result.success && result.data) {
        setCharts(result.data)
      }
    }
  }

  const handleSaveGlobal = () => {
    const effectiveImageUrl = stagedImageUrl || globalChart?.image_url

    if (!effectiveImageUrl) {
      setFeedback({ type: 'error', message: 'Please upload a size chart image first.' })
      return
    }

    startTransition(async () => {
      setFeedback(null)
      const formData = new FormData()
      formData.set('name', chartName.trim() || 'Global Size Chart')
      formData.set('image_url', effectiveImageUrl)
      if (stagedPublicId || globalChart?.cloudinary_public_id) {
        formData.set(
          'cloudinary_public_id',
          stagedPublicId || globalChart?.cloudinary_public_id || ''
        )
      }
      if (isActive) {
        formData.set('is_active', 'on')
      }

      const result = await createOrUpdateGlobalSizeChart({}, formData)

      if (result.success) {
        setStagedImageUrl(null)
        setStagedPublicId(null)
        // Refresh charts
        const refresh = await getAllSizeCharts()
        if (refresh.success && refresh.data) {
          setCharts(refresh.data)
        }
        setFeedback({ type: 'success', message: 'Global size chart saved successfully!' })
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to save size chart.' })
      }
    })
  }

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

  const currentPreviewImage = stagedImageUrl || globalChart?.image_url

  return (
    <div className="space-y-4">
      {/* Top Compact Navigation & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-panel p-2 sm:p-2.5 rounded-2xl border border-cream-line/70 shadow-sm">
        {/* Modern Segmented Control Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-cream-deep/60 rounded-xl border border-cream-line/50">
          <button
            type="button"
            onClick={() => handleTabChange('global')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'global'
                ? 'bg-panel text-ink shadow-sm border border-cream-line/80'
                : 'text-ink/60 hover:text-ink hover:bg-panel/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-gold" />
            <span>Global Size Chart</span>
            {globalChart && (
              <span
                className={`w-2 h-2 rounded-full ${
                  globalChart.is_active ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                title={globalChart.is_active ? 'Active' : 'Inactive'}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('list')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'list'
                ? 'bg-panel text-ink shadow-sm border border-cream-line/80'
                : 'text-ink/60 hover:text-ink hover:bg-panel/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-ink/50" />
            <span>All Size Charts</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-cream-deep text-ink/70 border border-cream-line/60">
              {charts.length}
            </span>
          </button>
        </div>

        {/* Status / Quick Notice */}
        <div className="flex items-center gap-3 px-2 text-xs text-ink/60">
          {globalChart?.is_active ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live on storefront
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Storefront chart inactive
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

      {/* TAB 1: Global Size Chart (Compact 2-Column Dashboard on Desktop) */}
      {activeTab === 'global' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT: Current Active Chart Live Card */}
          <div className="lg:col-span-5 bg-panel rounded-2xl border border-cream-line/70 p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-gold/10 text-gold-light border border-gold/20">
                  <Globe className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-ink">Active Global Chart</h2>
                  <p className="text-[11px] text-ink/50">Universal fallback for products</p>
                </div>
              </div>

              {globalChart && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    globalChart.is_active
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      globalChart.is_active ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {globalChart.is_active ? 'Active' : 'Hidden'}
                </span>
              )}
            </div>

            {/* Thumbnail Box */}
            {currentPreviewImage ? (
              <div className="space-y-2.5">
                <div
                  onClick={() =>
                    setZoomModalUrl({
                      url: currentPreviewImage,
                      title: globalChart?.name || 'Global Size Chart',
                    })
                  }
                  className="group relative w-full aspect-[4/3] rounded-xl border border-cream-line/80 overflow-hidden bg-cream-deep/60 cursor-pointer shadow-inner transition-all hover:border-gold/50"
                  title="Click to zoom in"
                >
                  <Image
                    src={currentPreviewImage}
                    alt={globalChart?.name || 'Global Size Chart'}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Staged Tag if user uploaded a new pending one */}
                  {stagedImageUrl && (
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-orange-600 text-white text-[10px] font-bold shadow-md uppercase tracking-wider flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Pending Save
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all flex flex-col items-center justify-center gap-1 text-white">
                    <ZoomIn className="w-6 h-6 stroke-[2.2]" />
                    <span className="text-xs font-semibold">Click to Zoom</span>
                  </div>
                </div>

                {/* Details Strip */}
                <div className="p-3 bg-cream-deep/50 rounded-xl border border-cream-line/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-ink/80">
                    <span className="font-semibold truncate max-w-[180px]">
                      {globalChart?.name || 'Global Size Chart'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setZoomModalUrl({
                          url: currentPreviewImage,
                          title: globalChart?.name || 'Global Size Chart',
                        })
                      }
                      className="inline-flex items-center gap-1 text-gold-light hover:underline font-medium"
                    >
                      <Eye className="w-3 h-3" />
                      Full View
                    </button>
                  </div>
                  {globalChart?.updated_at && (
                    <div className="text-[11px] text-ink/40 flex items-center justify-between">
                      <span>Last updated</span>
                      <span>{new Date(globalChart.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state if no chart */
              <div className="p-6 text-center rounded-xl border-2 border-dashed border-cream-line/80 bg-cream-deep/30 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-ink/30" />
                <p className="text-xs font-semibold text-ink/70">No Global Size Chart Set</p>
                <p className="text-[11px] text-ink/40 max-w-xs">
                  Upload an image on the right panel to establish the storewide size chart.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Compact Update & Upload Form */}
          <div className="lg:col-span-7 bg-panel rounded-2xl border border-cream-line/70 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="border-b border-cream-line/60 pb-3">
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <span>Configure Size Chart</span>
                {stagedImageUrl && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                    Unsaved Image
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-ink/50 mt-0.5">
                Set chart title, upload a replacement diagram, and manage storefront visibility.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Chart Name */}
              <div>
                <label
                  htmlFor="chart-name-input"
                  className="block text-xs font-bold text-ink/80 mb-1"
                >
                  Chart Display Name
                </label>
                <input
                  id="chart-name-input"
                  type="text"
                  value={chartName}
                  onChange={(e) => setChartName(e.target.value)}
                  placeholder="e.g. Standard Apparel Size Guide"
                  className="w-full px-3.5 py-2 bg-cream-deep/50 border border-cream-line/70 rounded-xl text-xs sm:text-sm font-medium text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
                />
              </div>

              {/* Upload Dropzone: Compact & Clean */}
              <div>
                <label className="block text-xs font-bold text-ink/80 mb-1">
                  Upload Chart Image
                </label>

                {stagedImageUrl ? (
                  /* Staged Image Mini Bar */
                  <div className="flex items-center justify-between p-2.5 bg-cream-deep/60 rounded-xl border border-cream-line/70">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="relative w-12 h-12 rounded-lg border border-cream-line/80 overflow-hidden bg-panel shrink-0">
                        <Image
                          src={stagedImageUrl}
                          alt="Staged"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">New Image Ready</p>
                        <p className="text-[10px] text-ink/50">Click Save to make this live</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <ImageKitUploadWidget
                        options={{
                          maxFiles: 1,
                          folder: 'rawflex/size-charts',
                          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                        }}
                        onSuccess={handleUploadSuccess}
                        onOpen={() => setIsUploading(true)}
                        onError={() => setIsUploading(false)}
                        onClose={() => setIsUploading(false)}
                      >
                        {({ open }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            disabled={isUploading || isPending}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-panel hover:bg-panel2 border border-cream-line text-ink/80 transition-colors"
                          >
                            Replace
                          </button>
                        )}
                      </ImageKitUploadWidget>

                      <button
                        type="button"
                        onClick={() => {
                          setStagedImageUrl(null)
                          setStagedPublicId(null)
                        }}
                        className="p-1.5 text-ink/50 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Discard new upload"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Compact Upload Dropzone */
                  <ImageKitUploadWidget
                    options={{
                      maxFiles: 1,
                      folder: 'rawflex/size-charts',
                      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                    }}
                    onSuccess={handleUploadSuccess}
                    onOpen={() => setIsUploading(true)}
                    onError={() => setIsUploading(false)}
                    onClose={() => setIsUploading(false)}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        disabled={isUploading || isPending}
                        className="w-full h-28 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-cream-line hover:border-gold/60 bg-cream-deep/40 hover:bg-panel2/60 transition-all text-ink/70 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gold" />
                        ) : (
                          <div className="p-2 rounded-full bg-cream-deep group-hover:bg-gold/15 group-hover:text-gold transition-colors">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                        )}
                        <span className="text-xs font-semibold text-ink group-hover:text-gold transition-colors">
                          {isUploading ? 'Uploading image...' : 'Click to select size chart image'}
                        </span>
                        <span className="text-[10px] text-ink/40">
                          PNG, JPG, or WEBP up to 15MB
                        </span>
                      </button>
                    )}
                  </ImageKitUploadWidget>
                )}
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 bg-cream-deep/40 rounded-xl border border-cream-line/60">
                <div>
                  <h3 className="text-xs font-bold text-ink">Active on Storefront</h3>
                  <p className="text-[11px] text-ink/50">
                    When active, customers can open this chart on product pages.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={isPending}
                  />
                  <div className="w-10 h-5 bg-panel2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-cream-line/60">
                <span className="text-[11px] text-ink/40">
                  {stagedImageUrl ? 'Changes not saved yet' : 'Ready to save'}
                </span>

                <div className="flex items-center gap-2">
                  {stagedImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setStagedImageUrl(null)
                        setStagedPublicId(null)
                      }}
                      disabled={isPending}
                      className="px-3 py-2 text-xs font-semibold rounded-xl text-ink/60 hover:text-ink hover:bg-cream-deep transition-colors"
                    >
                      Reset
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveGlobal}
                    disabled={isPending || (!stagedImageUrl && !globalChart?.image_url)}
                    className="admin-primary-action px-5 py-2 text-xs sm:text-sm rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1.5" />
                        Save Size Chart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: All Size Charts (Responsive Grid) */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-ink">All Stored Size Charts</h2>
              <p className="text-[11px] text-ink/50">Global and custom charts library</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-cream-deep text-ink/70 border border-cream-line/60">
              {charts.length} Total
            </span>
          </div>

          {charts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-cream-line bg-panel/40 space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-ink/30" />
              <p className="text-xs font-semibold text-ink/70">No size charts created yet</p>
              <p className="text-[11px] text-ink/40">
                Switch to the "Global Size Chart" tab to configure your first chart.
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
                    onClick={() => setZoomModalUrl({ url: chart.image_url, title: chart.name })}
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
                  </div>

                  {/* Body & Actions */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2 text-xs">
                    <div>
                      <h3 className="font-bold text-ink truncate" title={chart.name}>
                        {chart.name}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-ink/50 mt-1">
                        <span>{chart.is_active ? 'Active' : 'Inactive'}</span>
                        <span>{new Date(chart.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-cream-line/50">
                      <button
                        type="button"
                        onClick={() =>
                          setZoomModalUrl({ url: chart.image_url, title: chart.name })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/70 hover:text-ink transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      {!chart.is_global ? (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(chart.id)}
                          className="p-1.5 text-ink/40 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete size chart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-medium text-gold">Primary</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LIGHTBOX / ZOOM MODAL */}
      {zoomModalUrl && isMounted && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setZoomModalUrl(null)}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-white/55 p-3 sm:p-4 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-panel rounded-2xl border border-black shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-line/70">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-bold text-ink">{zoomModalUrl.title}</h3>
              </div>
              <button
                onClick={() => setZoomModalUrl(null)}
                className="p-1.5 text-ink/50 hover:text-ink hover:bg-cream-deep rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Box */}
            <div className="relative flex-1 min-h-[300px] sm:min-h-[460px] max-h-[75vh] bg-cream-deep/40 p-3 sm:p-4 flex items-center justify-center overflow-auto">
              <div className="relative w-full h-full min-h-[280px] sm:min-h-[440px]">
                <Image
                  src={zoomModalUrl.url}
                  alt={zoomModalUrl.title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-cream-deep/40 border-t border-cream-line/60 text-xs text-ink/60">
              <span>Press ESC or click outside to close</span>
              <a
                href={zoomModalUrl.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold-light hover:underline"
              >
                Open Original in New Tab
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
    </div>
  )
}