import { requireAdmin } from '@/lib/adminAuth'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import type { Metadata } from 'next'
import ProductRow from './_components/ProductRow'

export const metadata: Metadata = {
  title: 'Products',
}

export default async function ProductsPage() {
  const admin = await requireAdmin()
  const supabase = admin.ok ? admin.adminClient : null

  const { data: products } = supabase
    ? await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Products</h1>
          <p className="text-ink/60 text-sm mt-0.5">
            Manage your product catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="admin-primary-action px-4 py-2.5 text-sm rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="bg-panel rounded-xl border border-cream-line overflow-hidden">
        {!products || products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-ink/50 mx-auto mb-3" />
            <p className="text-ink/60 text-sm">No products yet</p>
            <p className="text-ink/40 text-xs mt-1">
              Create your first product to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-panel/50">
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Product
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Category
                  </th>
                  <th className="text-left text-xs font-medium text-ink/60 uppercase tracking-wider px-6 py-3">
                    Badge
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
                {products.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
