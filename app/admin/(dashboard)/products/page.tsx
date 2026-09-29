import { requireAdmin } from '@/lib/adminAuth'
import type { Metadata } from 'next'
import ProductCatalogManager from './_components/ProductCatalogManager'

export const metadata: Metadata = {
  title: 'Products | Admin Catalog',
  description: 'Manage your product catalog, descriptions, and streetwear specifications.',
}

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const admin = await requireAdmin()
  const supabase = admin.ok ? admin.adminClient : null

  let productsData: any[] = []
  let categoriesData: any[] = []

  if (supabase) {
    const [pRes, cRes] = await Promise.all([
      supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          product_variants(id, variant_name, price, original_price, stock_quantity, is_active),
          product_images(id, image_url, sort_order)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
    ])

    if (pRes.data) productsData = pRes.data
    if (cRes.data) categoriesData = cRes.data
  }

  return (
    <div className="w-full max-w-[1500px] mx-auto pb-16">
      <ProductCatalogManager
        initialProducts={productsData}
        categories={categoriesData}
      />
    </div>
  )
}
