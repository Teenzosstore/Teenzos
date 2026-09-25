'use client'

import { useState } from 'react'
import type { Category, Product, ProductFAQ, ProductImage, ProductInformation, ProductVariant } from '@/types/database'
import ProductForm from './ProductForm'
import ProductInfoEditor from './ProductInfoEditor'
import ProductFaqEditor from './ProductFaqEditor'
import { ProductVariantsEditor } from './ProductVariantsEditor'
import { ProductImagesEditor } from './ProductImagesEditor'

type OtherProduct = Pick<Product, 'id' | 'name' | 'color_group_id' | 'color_name'>
type EditableProduct = Product & {
  use_global_faqs: boolean
}

type ProductEditSectionsProps = {
  product: EditableProduct
  categories: Category[]
  otherProducts: OtherProduct[]
  information: ProductInformation[]
  faqs: ProductFAQ[]
  variants: ProductVariant[]
  images: ProductImage[]
}

export default function ProductEditSections({
  product,
  categories,
  otherProducts,
  information,
  faqs,
  variants,
  images,
}: ProductEditSectionsProps) {
  const [colorName, setColorName] = useState(product.color_name)
  const liveProduct = { ...product, color_name: colorName }

  return (
    <>
      <ProductForm
        product={liveProduct}
        categories={categories}
        otherProducts={otherProducts}
        onColorsChange={setColorName}
      />

      <ProductInfoEditor
        productId={product.id}
        initialItems={information}
      />

      <div className="bg-panel p-6 shadow-sm ring-1 ring-ink/10 sm:rounded-xl">
        <ProductVariantsEditor
          productId={product.id}
          variants={variants}
          colorName={colorName}
        />
      </div>

      <div className="bg-panel p-6 shadow-sm ring-1 ring-ink/10 sm:rounded-xl">
        <ProductImagesEditor
          product={liveProduct}
          images={images}
        />
      </div>

      <ProductFaqEditor
        productId={product.id}
        initialItems={faqs}
        initialUseGlobal={product.use_global_faqs}
      />
    </>
  )
}
