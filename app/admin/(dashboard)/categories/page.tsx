import { requireAdmin } from '@/lib/adminAuth'
import Link from 'next/link'
import { Plus, FolderTree } from 'lucide-react'
import type { Metadata } from 'next'
import CategoryRow from './_components/CategoryRow'

export const metadata: Metadata = {
  title: 'Categories',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Categories</h1>
          <p className="text-ink/60 text-sm mt-0.5">
            Manage your product categories
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="admin-primary-action px-4 py-2.5 text-sm rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Link>
      </div>

      {/* Table */}
      <div className="bg-panel rounded-xl border border-cream-line overflow-hidden">
        {!categories || categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-10 h-10 text-ink/50 mx-auto mb-3" />
            <p className="text-ink/60 text-sm">No categories yet</p>
            <p className="text-ink/40 text-xs mt-1">
              Create your first category to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-panel/50">
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Name
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Slug
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Created
                  </th>
                  <th className="text-right text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
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
