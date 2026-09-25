import { requireAdmin } from '@/lib/adminAuth'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'
import ProductEditSections from '../../../(dashboard)/products/_components/ProductEditSections'

export const metadata: Metadata = {
  title: 'Edit Product',
}

export default async function EditProductPage({
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

  const [productRes, categoriesRes, otherProductsRes, infoRes, faqRes, variantsRes, imagesRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase
      .from('categories')
      .select('*')
      .order('name'),
    supabase
      .from('products')
      .select('id, name, color_group_id, color_name')
      .neq('id', id)
      .order('name'),
    supabase
      .from('product_information')
      .select('*')
      .eq('product_id', id)
      .order('display_order'),
    supabase
      .from('product_faqs')
      .select('*')
      .eq('product_id', id)
      .order('display_order'),
    supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('created_at'),
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('sort_order'),
  ])

  if (!productRes.data) {
    notFound()
  }

  return (
    <AdminShell>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Edit Product</h1>
          <p className="text-ink/60 text-sm mt-0.5">
            Update &quot;{productRes.data.name}&quot;
          </p>
        </div>

        <ProductEditSections
          product={productRes.data}
          categories={categoriesRes.data || []}
          otherProducts={otherProductsRes.data || []}
          information={infoRes.data || []}
          faqs={faqRes.data || []}
          variants={variantsRes.data || []}
          images={imagesRes.data || []}
        />
      </div>
    </AdminShell>
  )
}
