import { requireAdmin } from '@/lib/adminAuth'
import type { Metadata } from 'next'
import ProductForm from '../_components/ProductForm'

export const metadata: Metadata = {
  title: 'New Product',
}

export default async function NewProductPage() {
  const admin = await requireAdmin()
  const supabase = admin.ok ? admin.adminClient : null

  const [{ data: categories }, { data: otherProducts }] = supabase
    ? await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('products')
          .select('id, name, color_group_id, color_name')
          .order('name'),
      ])
    : [{ data: [] }, { data: [] }]

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">New Product</h1>
        <p className="text-ink/60 text-sm mt-0.5">
          Add a new product to your catalog
        </p>
      </div>
      <ProductForm categories={categories || []} otherProducts={otherProducts || []} />
    </div>
  )
}
