"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type {
  Category,
  Product,
  ProductImage,
  ProductInformation,
  ProductVariant,
} from "@/types/database";
import ProductForm from "./ProductForm";
import ProductInfoEditor from "./ProductInfoEditor";
import { ProductVariantsEditor } from "./ProductVariantsEditor";
import { ProductImagesEditor } from "./ProductImagesEditor";

type OtherProduct = Pick<
  Product,
  "id" | "name" | "color_group_id" | "color_name"
>;

type ProductEditSectionsProps = {
  product: Product;
  categories: Category[];
  otherProducts: OtherProduct[];
  information: ProductInformation[];
  variants: ProductVariant[];
  images: ProductImage[];
  initialJustCreated?: boolean;
};

export default function ProductEditSections({
  product,
  categories,
  otherProducts,
  information,
  variants,
  images,
  initialJustCreated = false,
}: ProductEditSectionsProps) {
  const [colorName, setColorName] = useState(product.color_name);
  const liveProduct = { ...product, color_name: colorName };

  return (
    <div className="space-y-6">
      {/* ─── 1. Main Core Form (Basic Info, Status, Badges, Prices, Colors, Size Chart, SEO) ─── */}
      <ProductForm
        product={liveProduct}
        categories={categories}
        otherProducts={otherProducts}
        initialJustCreated={initialJustCreated}
        hideBottomBar={true}
        onColorsChange={setColorName}
        initialInformation={information}
      />

      {/* ─── 2 & 3. Size Options and Product Images Side-by-Side (Desktop 2-col, Mobile stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left Column: Size Options */}
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4 min-w-0">
          <ProductVariantsEditor
            productId={product.id}
            variants={variants}
            colorName={colorName}
          />
        </div>

        {/* Right Column: Product Images */}
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-4 min-w-0">
          <ProductImagesEditor product={liveProduct} images={images} />
        </div>
      </div>

      {/* ─── 4. Specifications & Additional Information ─── */}
      <ProductInfoEditor
        productId={product.id}
        initialItems={information.filter(
          (item) => item.label !== "Key Feature" && item.label !== "Feature"
        )}
      />

      {/* ─── 5. Persistent Sticky Bottom Action Bar for Edit Workflow (Full Width & Responsive) ─── */}
      <div className="sticky -bottom-4 sm:-bottom-6 lg:-bottom-8 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/90 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 shadow-xl mt-6">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Mobile Sync Indicator */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>⚡ Changes sync instantly with Supabase database</span>
          </div>

          {/* Action Buttons Row */}
          <div className="w-full flex items-center justify-between gap-2.5 sm:gap-4">
            <Link
              href="/admin/products"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 hover:text-black hover:bg-stone-100 transition-all border border-stone-200/90 bg-white shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
              <span>Back to Products</span>
            </Link>

            {/* Desktop Sync Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>⚡ Changes sync instantly with Supabase database</span>
            </div>

            <button
              type="submit"
              form="product-form"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-[#0B0D0E] hover:bg-[#F72585] rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>Update Product</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
