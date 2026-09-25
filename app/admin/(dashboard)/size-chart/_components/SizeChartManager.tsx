'use client'

import { useActionState, useState } from 'react'
import { createOrUpdateGlobalSizeChart, uploadSizeChartImage, deleteSizeChart, getAllSizeCharts, type ActionResult } from '@/actions/size-charts'
import Image from 'next/image'
import { Loader2, Image as ImageIcon, Trash2, Save, X, Check, AlertCircle } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'
import type { SizeChart } from '@/types/database'

interface SizeChartManagerProps {
  initialCharts?: SizeChart[]
}

export default function SizeChartManager({ initialCharts = [] }: SizeChartManagerProps) {
  const [charts, setCharts] = useState<SizeChart[]>(initialCharts)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'global' | 'list'>('global')

  const [globalState, globalAction] = useActionState<ActionResult, FormData>(
    createOrUpdateGlobalSizeChart,
    {}
  )

  const [uploadState, uploadAction] = useActionState<ActionResult, FormData>(
    uploadSizeChartImage,
    {}
  )

  const handleGlobalSubmit = (formData: FormData) => {
    if (!imageUrl) {
      return
    }
    formData.set('image_url', imageUrl)
    if (cloudinaryPublicId) {
      formData.set('cloudinary_public_id', cloudinaryPublicId)
    }
    globalAction(formData)
  }

  const handleUploadSuccess = (result: any) => {
    setImageUrl(result.info.secure_url)
    setCloudinaryPublicId(result.info.public_id)
    setIsUploading(false)
  }

  const handleUploadOpen = () => setIsUploading(true)
  const handleUploadError = () => setIsUploading(false)

  const handleDelete = async (id: string) => {
    setShowDeleteConfirm(id)
  }

  const confirmDelete = async (id: string) => {
    const result = await deleteSizeChart(id)
    if (result.success) {
      setCharts(charts.filter(c => c.id !== id))
    } else {
      alert(result.error || 'Failed to delete size chart')
    }
    setShowDeleteConfirm(null)
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

  // Find global chart
  const globalChart = charts.find(c => c.is_global)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-cream-line">
        <button
          onClick={() => handleTabChange('global')}
          className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-all ${
            activeTab === 'global'
              ? 'bg-gold/15 text-gold-light border-b-2 border-gold-light'
              : 'text-ink/60 hover:text-ink hover:bg-cream-deep/50'
          }`}
        >
          Global Size Chart
        </button>
        <button
          onClick={() => handleTabChange('list')}
          className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-all ${
            activeTab === 'list'
              ? 'bg-gold/15 text-gold-light border-b-2 border-gold-light'
              : 'text-ink/60 hover:text-ink hover:bg-cream-deep/50'
          }`}
        >
          All Size Charts
        </button>
      </div>

      {/* Global Size Chart Tab */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          {/* Current Global Chart Display */}
          <div className="bg-panel rounded-xl border border-cream-line p-6 space-y-5">
            <h2 className="text-base font-semibold text-ink">Current Global Size Chart</h2>
            
            {globalChart ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative w-48 h-48 shrink-0 rounded-xl border border-cream-line overflow-hidden bg-cream-deep">
                    <Image
                      src={globalChart.image_url}
                      alt={globalChart.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-ink">{globalChart.name}</h3>
                    <p className="text-sm text-ink/60">
                      {globalChart.is_active ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-xs text-ink/40">
                      Updated: {new Date(globalChart.updated_at).toISOString().split('T')[0]}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl border-2 border-dashed border-cream-line bg-panel/50">
                <ImageIcon className="w-10 h-10 mx-auto text-ink/30 mb-2" />
                <p className="text-ink/60">No global size chart configured yet</p>
                <p className="text-xs text-ink/40 mt-1">Upload an image below to set the global size chart</p>
              </div>
            )}
          </div>

          {/* Upload New Global Chart */}
          <div className="bg-panel rounded-xl border border-cream-line p-6 space-y-5">
            <h2 className="text-base font-semibold text-ink">Update Global Size Chart</h2>
            <p className="text-xs text-ink/40">
              Upload a new size chart image to replace the current global size chart. This will be used by all products that have "Use Global Size Chart" enabled.
            </p>

            <form action={handleGlobalSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="size-chart-name"
                  className="block text-sm font-medium text-ink/80 mb-1.5"
                >
                  Chart Name
                </label>
                <input
                  id="size-chart-name"
                  name="name"
                  type="text"
                  defaultValue="Global Size Chart"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-ink/80 mb-1.5">
                  Size Chart Image
                </label>
                
                {imageUrl ? (
                  <div className="relative w-full max-w-md aspect-video rounded-xl border border-cream-line overflow-hidden bg-cream-deep">
                    <Image
                      src={imageUrl}
                      alt="Size Chart Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(null)
                        setCloudinaryPublicId(null)
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-panel/90 hover:bg-panel2 text-ink/80 hover:text-red-600 rounded-lg shadow-sm backdrop-blur-sm transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <CldUploadWidget
                    signatureEndpoint="/api/cloudinary/sign"
                    options={{
                      maxFiles: 1,
                      resourceType: "image",
                      folder: "rawflex/size-charts",
                      clientAllowedFormats: ["jpg", "jpeg", "png", "webp"]
                    }}
                    onSuccess={handleUploadSuccess}
                    onOpen={handleUploadOpen}
                    onError={handleUploadError}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        disabled={isUploading}
                        className="w-full max-w-md aspect-video flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-line bg-cream-deep text-ink/60 hover:bg-panel2 hover:border-orange-400 hover:text-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        ) : (
                          <ImageIcon className="w-6 h-6" />
                        )}
                        <span className="text-sm font-medium">Click to upload size chart image</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}

                {globalState.error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {globalState.error}
                  </p>
                )}

                {globalState.success && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Global size chart updated successfully!
                  </p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  id="size-chart-active"
                  name="is_active"
                  type="checkbox"
                  defaultChecked={true}
                  className="w-4 h-4 rounded border-cream-line text-orange-600 focus:ring-orange-500"
                />
                <label
                  htmlFor="size-chart-active"
                  className="text-sm font-medium text-ink/80"
                >
                  Active — visible to customers
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!imageUrl}
                className="admin-primary-action px-5 py-2.5 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span className="ml-2">Save Global Size Chart</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* All Size Charts Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">All Size Charts</h2>
            <span className="text-sm text-ink/50">{charts.length} chart(s)</span>
          </div>

          {charts.length === 0 ? (
            <div className="p-8 text-center rounded-xl border-2 border-dashed border-cream-line bg-panel/50">
              <ImageIcon className="w-12 h-12 mx-auto text-ink/30 mb-3" />
              <p className="text-ink/60">No size charts found</p>
              <p className="text-xs text-ink/40 mt-1">Create a global size chart to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {charts.map(chart => (
                <div
                  key={chart.id}
                  className="bg-panel rounded-xl border border-cream-line p-4 space-y-3"
                >
                  <div className="relative aspect-video rounded-lg border border-cream-line overflow-hidden bg-cream-deep">
                    <Image
                      src={chart.image_url}
                      alt={chart.name}
                      fill
                      className="object-cover"
                    />
                    {chart.is_global && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-gold/20 text-gold text-xs font-semibold rounded-full">
                        Global
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-semibold text-ink truncate">{chart.name}</h3>
                    <p className="text-xs text-ink/50">
                      {chart.is_active ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-xs text-ink/40">
                      Updated: {new Date(chart.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  {!chart.is_global && (
                    <div className="flex items-center justify-end pt-2 border-t border-cream-line">
                      <button
                        onClick={() => handleDelete(chart.id)}
                        className="p-2 text-ink/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete size chart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-panel rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-ink">Delete Size Chart?</h3>
            <p className="text-ink/70">
              Are you sure you want to delete this size chart? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink bg-cream-deep rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-cream bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}