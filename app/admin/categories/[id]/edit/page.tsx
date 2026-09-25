import { requireAdmin } from '@/lib/adminAuth'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'
import CategoryForm from '../../../(dashboard)/categories/_components/CategoryForm'

export const metadata: Metadata = {
  title: 'Edit Category',
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
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Edit Category</h1>
          <p className="text-ink/60 text-sm mt-0.5">
            Update &quot;{category.name}&quot;
          </p>
        </div>
        <CategoryForm category={category} />
      </div>
    </AdminShell>
  )
}
