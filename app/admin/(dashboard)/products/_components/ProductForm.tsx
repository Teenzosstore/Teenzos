'use client'

import { useTransition, useActionState, useState } from 'react'
import { createProduct, updateProduct, type ActionResult } from '@/actions/products'
import { uploadSizeChartImage, type ActionResult as SizeChartActionResult } from '@/actions/size-charts'
import Link from 'next/link'
import Image from 'next/image'
import { Save, ArrowLeft, Image as ImageIcon, Loader2, X, Ruler } from 'lucide-react'
import { CldUploadWidget } from 'next-cloudinary'
import type { Category, Product } from '@/types/database'

type OtherProduct = Pick<Product, 'id' | 'name' | 'color_group_id' | 'color_name'>

interface ProductFormProps {
  product?: Product
  categories: Category[]
  otherProducts?: OtherProduct[]
  onColorsChange?: (colorName: string) => void
}

export default function ProductForm({ product, categories, otherProducts = [], onColorsChange }: ProductFormProps) {
  const isEditing = !!product
  const action = isEditing ? updateProduct : createProduct

  const [state, formAction] = useActionState<ActionResult, FormData>(
    action,
    {}
  )
  const [pending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageCloudinaryPublicId, setImageCloudinaryPublicId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Parse initial colors from JSON or legacy format
  const initialColors = (() => {
    if (!product?.color_name) return []
    try {
      if (product.color_name.startsWith('[')) {
        return JSON.parse(product.color_name) as { name: string; hex: string }[]
      }
    } catch (e) {}
    // Fallback for legacy comma-separated values
    return product.color_name.split(',').map(c => ({ name: c.trim(), hex: '#E6DAC4' })).filter(c => c.name)
  })()

  const [colorsList, setColorsList] = useState<{ name: string; hex: string }[]>(initialColors)
  const [colorInputName, setColorInputName] = useState('')
  const [colorInputHex, setColorInputHex] = useState('#1E3B2E')

  // Size Chart state
  const [useGlobalSizeChart, setUseGlobalSizeChart] = useState(product?.use_global_size_chart ?? true)
  const [sizeChartImageUrl, setSizeChartImageUrl] = useState<string | null>(product?.size_chart_image_url || null)
  const [sizeChartCloudinaryId, setSizeChartCloudinaryId] = useState<string | null>(product?.size_chart_cloudinary_public_id || null)
  const [isSizeChartUploading, setIsSizeChartUploading] = useState(false)
  const [sizeChartUploadState, sizeChartUploadAction] = useActionState<SizeChartActionResult, FormData>(
    uploadSizeChartImage,
    {}
  )

  const handleSizeChartUploadSuccess = (result: any) => {
    setSizeChartImageUrl(result.info.secure_url)
    setSizeChartCloudinaryId(result.info.public_id)
    setIsSizeChartUploading(false)
  }

  const handleSizeChartUploadOpen = () => setIsSizeChartUploading(true)
  const handleSizeChartUploadError = () => setIsSizeChartUploading(false)

  const handleAddColor = () => {
    const name = colorInputName.trim()
    if (!name) return
    if (colorsList.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return
    }
    const nextColors = [...colorsList, { name, hex: colorInputHex }]
    setColorsList(nextColors)
    onColorsChange?.(JSON.stringify(nextColors))
    setColorInputName('')
  }

  const handleRemoveColor = (nameToRemove: string) => {
    const nextColors = colorsList.filter(c => c.name !== nameToRemove)
    setColorsList(nextColors)
    onColorsChange?.(JSON.stringify(nextColors))
  }

  return (
    <form
      action={(formData) => startTransition(() => formAction(formData))}
      className="space-y-6"
    >
      {isEditing && <input type="hidden" name="id" value={product.id} />}

      {/* Error */}
      {state.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-panel rounded-xl border border-cream-line p-6 space-y-5">
            <h2 className="text-base font-semibold text-ink">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="product-name"
                  className="block text-sm font-medium text-ink/80 mb-1.5"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-name"
                  name="name"
                  type="text"
                  required
                  maxLength={255}
                  defaultValue={product?.name || ''}
                  placeholder="e.g. Premium Front Open Abaya"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
                />
                <p className="text-xs text-ink/40 mt-1.5">
                  Slug will be auto-generated from the name.
                </p>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="product-category"
                  className="block text-sm font-medium text-ink/80 mb-1.5"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="product-category"
                  name="category_id"
                  required
                  defaultValue={product?.category_id || ''}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Base Price */}
            <div>
              <label
                htmlFor="product-price"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                Base Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="product-price"
                name="price"
                type="number"
                required
                step="0.01"
                min="0"
                defaultValue={product?.price || ''}
                placeholder="e.g. 1499"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
              />
              <p className="text-xs text-ink/40 mt-1.5">
                Base price for the product. Variants can have their own prices.
              </p>
            </div>

            {/* Short Description */}
            <div>
              <label
                htmlFor="product-short-desc"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                Short Description
              </label>
              <textarea
                id="product-short-desc"
                name="short_description"
                rows={3}
                maxLength={500}
                defaultValue={product?.short_description || ''}
                placeholder="Brief one-liner about the product"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Fabric Details */}
              <div>
                <label
                  htmlFor="product-fabric"
                  className="block text-sm font-medium text-ink/80 mb-1.5"
                >
                  Fabric Details
                </label>
                <input
                  id="product-fabric"
                  name="fabric"
                  type="text"
                  defaultValue={(product as any)?.fabric || ''}
                  placeholder="e.g. Premium quality nida/crepe"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
                />
              </div>

              {/* Stitching Details */}
              <div>
                <label
                  htmlFor="product-stitching"
                  className="block text-sm font-medium text-ink/80 mb-1.5"
                >
                  Stitching Details
                </label>
                <input
                  id="product-stitching"
                  name="stitching"
                  type="text"
                  defaultValue={(product as any)?.stitching || ''}
                  placeholder="e.g. Dual-reinforced seams"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="product-description"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                Full Description
              </label>
              <textarea
                id="product-description"
                name="description"
                rows={14}
                maxLength={5000}
                defaultValue={product?.description || ''}
                placeholder="Detailed product description..."
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200 resize-y"
              />
            </div>
          </div>

          {/* SEO */}
          <div className="bg-panel rounded-xl border border-cream-line p-6 space-y-5">
            <h2 className="text-base font-semibold text-ink">SEO</h2>

            <div>
              <label
                htmlFor="seo-title"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                SEO Title
              </label>
              <input
                id="seo-title"
                name="seo_title"
                type="text"
                maxLength={200}
                defaultValue={product?.seo_title || ''}
                placeholder="Custom title for search engines"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="seo-description"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                SEO Description
              </label>
              <textarea
                id="seo-description"
                name="seo_description"
                rows={5}
                maxLength={500}
                defaultValue={product?.seo_description || ''}
                placeholder="Meta description for search results"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200 resize-y"
              />
            </div>

            <div>
              <label
                htmlFor="seo-keywords"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                SEO Keywords (comma separated)
              </label>
              <input
                id="seo-keywords"
                name="seo_keywords"
                type="text"
                defaultValue={product?.seo_keywords || ''}
                placeholder="e.g. abaya, modest fashion, premium hijab"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status */}
          <div className="bg-panel rounded-xl border border-cream-line p-6 space-y-5">
            <h2 className="text-base font-semibold text-ink">Status</h2>

            {/* Badge / Tag */}
            <div>
              <label
                htmlFor="product-badge"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                Badge / Tag
              </label>
              <select
                id="product-badge"
                name="badge"
                defaultValue={product?.badge || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-panel text-ink focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-200"
              >
                <option value="">No badge</option>
                <option value="New">New</option>
                <option value="Hot">Hot</option>
                <option value="Bestseller">Bestseller</option>
                <option value="Premium">Premium</option>
                <option value="Popular">Popular</option>
                <option value="Luxe">Luxe</option>
                <option value="Handcrafted">Handcrafted</option>
              </select>
              <p className="text-xs text-ink/40 mt-1.5">
                Shown as a small tag on the product card in the storefront.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                id="product-active"
                name="is_active"
                type="checkbox"
                defaultChecked={product?.is_active ?? true}
                className="w-4 h-4 rounded border-cream-line text-orange-600 focus:ring-orange-500"
              />
              <label
                htmlFor="product-active"
                className="text-sm font-medium text-ink/80"
              >
                Active — visible in the store
              </label>
            </div>

            {/* Featured Status */}
            <div className="flex items-center gap-3">
              <input
                id="product-featured"
                name="is_featured"
                type="checkbox"
                defaultChecked={product?.is_featured ?? false}
                className="w-4 h-4 rounded border-cream-line text-orange-600 focus:ring-orange-500"
              />
              <label
                htmlFor="product-featured"
                className="text-sm font-medium text-ink/80"
              >
                Featured — highlight on homepage
              </label>
            </div>
          </div>
          {/* Colors Management */}
          <div className="bg-panel rounded-xl border border-cream-line p-6 space-y-5">
            <h2 className="text-base font-semibold text-ink">Product Colors</h2>
            <p className="text-xs text-ink/40 -mt-3">
              Add the colors available for this product. 
              <strong> Click "{isEditing ? 'Update Product' : 'Create Product'}" to save the product and generate these tabs for image uploads below.</strong>
            </p>

            <div className="space-y-4">
              {/* Color List / Tags */}
              {colorsList.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 bg-cream-deep rounded-xl border border-cream-line">
                  {colorsList.map((c) => (
                    <div 
                      key={c.name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-panel border border-cream-line text-xs font-semibold text-ink/80 shadow-sm"
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" 
                        style={{ backgroundColor: c.hex }} 
                      />
                      <span>{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(c.name)}
                        className="text-ink/40 hover:text-red-500 transition-colors ml-1 font-bold text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl border-2 border-dashed border-cream-line bg-panel/50">
                  <p className="text-xs text-ink/40">No colors added yet.</p>
                </div>
              )}

              {/* Add New Color Form */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={colorInputName}
                    onChange={(e) => setColorInputName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddColor()
                      }
                    }}
                    placeholder="Color name (e.g. Olive, Cream)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cream-line bg-panel text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={colorInputHex}
                    onChange={(e) => setColorInputHex(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-cream-line cursor-pointer shrink-0 p-0.5"
                  />
                  <span className="text-[10px] font-mono text-ink/60 uppercase">{colorInputHex}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3.5 py-2 bg-panel hover:bg-panel2 text-ink text-xs font-semibold rounded-xl transition-all"
                >
                  Add
                </button>
              </div>

{/* Hidden field to submit JSON string to backend */}
              <input type="hidden" name="color_name" value={JSON.stringify(colorsList)} />
           </div>
         </div>
       </div>
       </div>

       {/* Size Chart */}
       <div className="bg-panel rounded-xl border border-cream-line p-6 space-y-5">
         <div className="flex items-center gap-2">
           <Ruler className="w-5 h-5 text-emerald" />
           <h2 className="text-base font-semibold text-ink">Size Chart</h2>
         </div>
         <p className="text-xs text-ink/40">
           Choose whether to use the global size chart or upload a specific size chart for this product.
         </p>

         {/* Size Chart Options */}
         <div className="space-y-4">
           <div className="flex items-center gap-3">
             <input
               id="use-global-size-chart"
               type="radio"
               name="size_chart_type"
               value="global"
               checked={useGlobalSizeChart}
               onChange={() => setUseGlobalSizeChart(true)}
               className="w-4 h-4 text-emerald border-cream-line focus:ring-emerald"
             />
             <label
               htmlFor="use-global-size-chart"
               className="text-sm font-medium text-ink/80 cursor-pointer"
             >
               Use Global Size Chart
             </label>
           </div>

           <div className="flex items-center gap-3">
             <input
               id="use-custom-size-chart"
               type="radio"
               name="size_chart_type"
               value="custom"
               checked={!useGlobalSizeChart}
               onChange={() => setUseGlobalSizeChart(false)}
               className="w-4 h-4 text-emerald border-cream-line focus:ring-emerald"
             />
             <label
               htmlFor="use-custom-size-chart"
               className="text-sm font-medium text-ink/80 cursor-pointer"
             >
               Use Custom Size Chart for this Product
             </label>
           </div>
         </div>

         {/* Custom Size Chart Upload */}
         {!useGlobalSizeChart && (
           <div className="space-y-4 pt-4 border-t border-cream-line/50">
             <label className="block text-sm font-medium text-ink/80 mb-1.5">
               Custom Size Chart Image
             </label>

             {sizeChartImageUrl ? (
               <div className="relative w-full max-w-md aspect-video rounded-xl border border-cream-line overflow-hidden bg-cream-deep">
                 <Image
                   src={sizeChartImageUrl}
                   alt="Custom Size Chart Preview"
                   fill
                   className="object-cover"
                 />
                 <button
                   type="button"
                   onClick={() => {
                     setSizeChartImageUrl(null)
                     setSizeChartCloudinaryId(null)
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
                 onSuccess={handleSizeChartUploadSuccess}
                 onOpen={handleSizeChartUploadOpen}
                 onError={handleSizeChartUploadError}
               >
{({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      disabled={isSizeChartUploading}
                      className="w-full max-w-md aspect-video flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-line bg-cream-deep text-ink/60 hover:bg-panel2 hover:border-orange-400 hover:text-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                     {isSizeChartUploading ? (
                       <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                     ) : (
                       <ImageIcon className="w-6 h-6" />
                     )}
                     <span className="text-sm font-medium">Click to upload custom size chart</span>
                   </button>
                 )}
               </CldUploadWidget>
             )}

             {sizeChartUploadState.error && (
               <p className="text-sm text-red-600">{sizeChartUploadState.error}</p>
             )}
           </div>
         )}

         {/* Hidden fields for form submission */}
         <input type="hidden" name="use_global_size_chart" value={useGlobalSizeChart.toString()} />
         <input type="hidden" name="size_chart_image_url" value={sizeChartImageUrl || ''} />
         <input type="hidden" name="size_chart_cloudinary_public_id" value={sizeChartCloudinaryId || ''} />
       </div>

       {/* Product Images */}
        <div className="mt-6 bg-panel rounded-xl border border-cream-line p-6 space-y-5">
          <h2 className="text-base font-semibold text-ink">Product Images</h2>
          <p className="text-xs text-ink/40">
            Upload product images. The first image will be set as the featured image.
          </p>
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1.5">
              Product Image (Optional)
            </label>
            <input type="hidden" name="image_url" value={imageUrl || ''} />
            <input type="hidden" name="cloudinary_public_id" value={imageCloudinaryPublicId || ''} />
            
            {imageUrl ? (
              <div className="relative w-full max-w-sm aspect-video rounded-xl border border-cream-line overflow-hidden bg-cream-deep">
                <Image 
                  src={imageUrl} 
                  alt="Product Image Preview" 
                  fill 
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(null)
                    setImageCloudinaryPublicId(null)
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
                  folder: "rawflex/products",
                  clientAllowedFormats: ["jpg", "jpeg", "png", "webp"]
                }}
                onSuccess={(result: any) => {
                  setImageUrl(result.info.secure_url)
                  setImageCloudinaryPublicId(result.info.public_id || null)
                  setIsUploading(false)
                }}
                onOpen={() => setIsUploading(true)}
                onError={() => setIsUploading(false)}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    disabled={isUploading || pending}
                    className="w-full max-w-sm aspect-video flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-line bg-cream-deep text-ink/60 hover:bg-panel2 hover:border-orange-400 hover:text-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                    <span className="text-sm font-medium">Click to upload an image</span>
                  </button>
                )}
              </CldUploadWidget>
            )}
          </div>
        </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="admin-primary-action px-5 py-2.5 text-sm rounded-xl"
        >
          {pending ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEditing ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}
