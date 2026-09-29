'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Save, Sparkles, Check, ArrowDown, ArrowUp } from 'lucide-react'
import { saveProductInformation } from '@/actions/products'

interface InfoItem {
  id?: string
  label: string
  value: string
  display_order: number
}

const PRESET_SPECIFICATIONS = [
  { label: 'Fabric Details', placeholder: 'e.g. 380 GSM Heavyweight French Terry Cotton' },
  { label: 'Fit Profile', placeholder: 'e.g. Relaxed Boxy Streetwear Oversized Silhouette' },
  { label: 'Stitching Details', placeholder: 'e.g. Double-Needle Reinforced Seams & Bar-Tacked Stress Points' },
  { label: 'Hood & Neck', placeholder: 'e.g. Double-Layered Hood with Custom Drawstrings' },
  { label: 'Graphic Technique', placeholder: 'e.g. High-Density Screen Print with Textured Puff Detailing' },
  { label: 'Care Instructions', placeholder: 'e.g. Machine wash cold inside out, tumble dry low, do not iron print' },
  { label: 'Country of Origin', placeholder: 'e.g. Crafted with Pride in India' },
  { label: 'Material Composition', placeholder: 'e.g. 100% Super Combed Compact Cotton' },
  { label: 'Pocket Details', placeholder: 'e.g. Deep Kangaroo Pouch with Reinforced Corners' },
  { label: 'Cuffs & Hem', placeholder: 'e.g. 2x2 Lycra Ribbed Cuffs for Retained Elasticity' },
]

export default function ProductInfoEditor({
  productId,
  initialItems,
}: {
  productId: string
  initialItems: InfoItem[]
}) {
  const specItems = (initialItems || []).filter(
    (item) => item.label !== 'Key Feature' && item.label !== 'Feature'
  )

  const [items, setItems] = useState<InfoItem[]>(
    specItems.length > 0
      ? specItems
      : [
          { label: 'Fabric Details', value: '380 GSM Heavyweight Cotton Fleece', display_order: 0 },
          { label: 'Fit Profile', value: 'Oversized Streetwear Boxy Silhouette', display_order: 1 },
          { label: 'Stitching Details', value: 'Double-needle reinforced seams', display_order: 2 },
          { label: 'Care Instructions', value: 'Machine wash cold inside out, tumble dry low', display_order: 3 },
          { label: 'Country of Origin', value: 'Crafted with Pride in India', display_order: 4 },
        ]
  )
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const addItem = (label = '', value = '') => {
    setItems((prev) => [
      ...prev,
      { label, value, display_order: prev.length },
    ])
  }

  const addPreset = (preset: { label: string; placeholder: string }) => {
    const existingIndex = items.findIndex(
      (item) => item.label.toLowerCase().trim() === preset.label.toLowerCase().trim()
    )
    if (existingIndex !== -1) {
      // If already present, don't duplicate
      return
    }
    addItem(preset.label, '')
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp
    newItems.forEach((item, idx) => {
      item.display_order = idx
    })
    setItems(newItems)
  }

  const updateItem = (
    index: number,
    field: 'label' | 'value',
    value: string
  ) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleSave = () => {
    const validItems = items
      .filter((item) => item.label.trim() && item.value.trim())
      .map((item, idx) => ({ ...item, display_order: idx }))

    startTransition(async () => {
      const result = await saveProductInformation(productId, validItems)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Specifications & Additional Information saved successfully!' })
        setTimeout(() => setMessage(null), 3500)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#0B0D0E]">
              Specifications & Additional Information
            </h2>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFE1ED] text-[#F72585] border border-[#F72585]/20">
              {items.length} Specs
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage product specifications (Fabric, Fit, Stitching, Care, Origin) displayed in the storefront Specifications tab & admin cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addItem()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Row</span>
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-stone-400 hover:text-stone-600 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Add Presets Chips */}
      <div className="space-y-1.5 bg-[#FAF9F8] p-3 rounded-lg border border-stone-200/80">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#F72585]" />
          <span>Quick Add Common Streetwear Specifications:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_SPECIFICATIONS.map((preset) => {
            const isAdded = items.some(
              (item) => item.label.toLowerCase().trim() === preset.label.toLowerCase().trim()
            )
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => addPreset(preset)}
                className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-all flex items-center gap-1 border ${
                  isAdded
                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-default'
                    : 'bg-white text-stone-700 hover:text-[#F72585] hover:border-[#F72585]/40 border-stone-200 shadow-2xs'
                }`}
                title={isAdded ? 'Already added' : `Add ${preset.label}`}
              >
                {isAdded ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Plus className="w-3 h-3 text-[#F72585]" />
                )}
                <span>{preset.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' && <Check className="w-4 h-4 text-green-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Specifications Rows */}
      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-[#FBFBFA] p-2 rounded-lg border border-stone-200/80 group hover:border-stone-300 transition-colors"
          >
            {/* Reorder Buttons */}
            <div className="flex flex-col gap-0.5 shrink-0 text-stone-400">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveItem(index, 'up')}
                className="p-0.5 hover:text-stone-800 disabled:opacity-20 transition-opacity"
                title="Move up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 'down')}
                className="p-0.5 hover:text-stone-800 disabled:opacity-20 transition-opacity"
                title="Move down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>

            {/* Label Input */}
            <input
              type="text"
              maxLength={100}
              value={item.label}
              onChange={(e) => updateItem(index, 'label', e.target.value)}
              placeholder="Specification Label (e.g. Fabric Details)"
              className="w-1/3 min-w-[130px] px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm font-semibold text-[#0B0D0E] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/30 focus:border-[#F72585] transition-all"
            />

            {/* Value Input */}
            <input
              type="text"
              maxLength={1000}
              value={item.value}
              onChange={(e) => updateItem(index, 'value', e.target.value)}
              placeholder="Value (e.g. 380 GSM Heavyweight Terry Cotton)"
              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-[#0B0D0E] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F72585]/30 focus:border-[#F72585] transition-all"
            />

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
              title="Remove specification row"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="admin-primary-action px-4 py-2 text-xs sm:text-sm rounded-lg font-bold inline-flex items-center gap-2 shadow-xs disabled:opacity-60 transition-all"
        >
          {isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Specifications & Info</span>
        </button>

        <span className="text-[11px] text-stone-400">
          Saved data appears under the &quot;Specifications&quot; tab on the product page.
        </span>
      </div>
    </div>
  )
}
