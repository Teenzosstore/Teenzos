import { requireAdmin } from '@/lib/adminAuth'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Edit3, ArrowLeft, ExternalLink } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import CategoryForm from '../../../(dashboard)/categories/_components/CategoryForm'

export const metadata: Metadata = {
  title: 'Edit Category | TeenZos Admin',
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = await requireAdmin()
  if (admin.ok === false) {
    redirect('/admin/login')
  }
  const supabase = admin.adminClient

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (!category) {
    notFound()
  }

  return (
    <AdminShell>
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
              <span className="text-ink font-semibold">Edit &quot;{category.name}&quot;</span>
            </nav>

            <div className="flex items-center gap-2.5 pt-0.5">
              <div className="w-8 h-8 rounded-xl bg-[#F72585]/10 text-[#F72585] flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-ink leading-tight">
                  Edit Category
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-cream-deep text-ink/65 border border-cream-line">
                  {category.slug || category.id}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    category.is_active
                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                      : 'bg-stone-500/15 text-stone-500 border border-stone-500/20'
                  }`}
                >
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href={`/shop?category=${category.slug || category.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-cream-line bg-panel hover:bg-cream-deep text-xs font-semibold text-ink/70 hover:text-ink transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View in Shop</span>
            </Link>
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-cream-line bg-panel hover:bg-cream-deep text-xs font-semibold text-ink/70 hover:text-ink transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Categories</span>
            </Link>
          </div>
        </div>

        {/* Form */}
        <CategoryForm category={category} />
      </div>
    </AdminShell>
  )
}
