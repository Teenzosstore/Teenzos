import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, PlusCircle, ArrowLeft } from 'lucide-react'
import CategoryForm from '../_components/CategoryForm'

export const metadata: Metadata = {
  title: 'New Category | TeenZos Admin',
}

export default function NewCategoryPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cream-line/60">
        <div className="space-y-1">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-ink/50 font-medium">
            <Link
              href="/admin/categories"
              className="hover:text-[#F72585] transition-colors"
            >
              Categories
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-ink/30" />
            <span className="text-ink font-semibold">New Category</span>
          </nav>

          <div className="flex items-center gap-2.5 pt-0.5">
            <div className="w-8 h-8 rounded-xl bg-[#F72585]/10 text-[#F72585] flex items-center justify-center font-bold">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-ink leading-tight">
                Add New Category
              </h1>
              <p className="text-xs text-ink/55">
                Organize your catalog with collections & navigation filters
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cream-line bg-panel hover:bg-cream-deep text-xs font-semibold text-ink/70 hover:text-ink transition-all self-start sm:self-auto shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </Link>
      </div>

      {/* Form */}
      <CategoryForm />
    </div>
  )
}
