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
    <div className="w-full space-y-5">
      <ProductForm categories={categories || []} otherProducts={otherProducts || []} />
    </div>
  )
}
