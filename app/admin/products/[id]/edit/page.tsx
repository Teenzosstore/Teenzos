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
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ created?: string }>
}) {
  const { id } = await params
  const sParams = searchParams ? await searchParams : {}
  const isJustCreated = sParams?.created === 'true' || sParams?.created === '1'

  const admin = await requireAdmin()
  if (admin.ok === false) {
    redirect('/admin/login')
  }
  const supabase = admin.adminClient

  const [productRes, categoriesRes, otherProductsRes, infoRes, variantsRes, imagesRes] = await Promise.all([
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
      <div className="w-full space-y-5">
        <ProductEditSections
          product={productRes.data}
          categories={categoriesRes.data || []}
          otherProducts={otherProductsRes.data || []}
          information={infoRes.data || []}
          variants={variantsRes.data || []}
          images={imagesRes.data || []}
          initialJustCreated={isJustCreated}
        />
      </div>
    </AdminShell>
  )
}
