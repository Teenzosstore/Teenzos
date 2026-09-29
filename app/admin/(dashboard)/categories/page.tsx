import { requireAdmin } from '@/lib/adminAuth'
import Link from 'next/link'
import { Plus, FolderTree } from 'lucide-react'
import type { Metadata } from 'next'
import CategoryRow from './_components/CategoryRow'

export const metadata: Metadata = {
  title: 'Categories | TeenZos Admin',
}

export default async function CategoriesPage() {
  const admin = await requireAdmin()
  const supabase = admin.ok ? admin.adminClient : null

  const { data: categories } = supabase
    ? await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })
    : { data: [] }

  const totalCount = categories?.length || 0

  return (
    <div className="space-y-4 sm:space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-cream-line/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink">Categories</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cream-deep text-ink/65 border border-cream-line">
              {totalCount}
            </span>
          </div>
          <p className="text-ink/60 text-xs sm:text-sm mt-0.5">
            Organize catalog collections and store navigation
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="admin-primary-action px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-panel rounded-2xl border border-cream-line shadow-xs overflow-hidden">
        {!categories || categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cream-deep mx-auto mb-3 flex items-center justify-center text-ink/40">
              <FolderTree className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-ink font-semibold text-sm">No categories created yet</p>
            <p className="text-ink/45 text-xs mt-1 max-w-xs mx-auto">
              Create your first category collection to organize products on the storefront.
            </p>
            <Link
              href="/admin/categories/new"
              className="admin-primary-action px-4 py-2 text-xs rounded-xl inline-flex mt-4"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Category</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-panel2/40 border-b border-cream-line text-ink/60 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 sm:px-5 py-3">Category</th>
                  <th className="px-3 sm:px-4 py-3 hidden sm:table-cell">Slug</th>
                  <th className="px-2 sm:px-4 py-3">Status</th>
                  <th className="px-3 sm:px-4 py-3 hidden md:table-cell">Created</th>
                  <th className="px-3 sm:px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-line">
                {categories.map((category) => (
                  <CategoryRow key={category.id} category={category} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
