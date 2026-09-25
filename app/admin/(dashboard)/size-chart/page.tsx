import { requireAdmin } from '@/lib/adminAuth'
import { getAllSizeCharts } from '@/actions/size-charts'
import type { Metadata } from 'next'
import SizeChartManager from './_components/SizeChartManager'

export const metadata: Metadata = {
  title: 'Size Chart',
}

export default async function SizeChartPage() {
  const admin = await requireAdmin()
  const result = await getAllSizeCharts()
  const initialCharts = result.success ? result.data || [] : []

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Size Chart Management</h1>
        <p className="text-ink/60 text-sm mt-0.5">
          Manage the global size chart used across all products. Products can use this global chart or have their own specific size chart.
        </p>
      </div>
      <SizeChartManager initialCharts={initialCharts} />
    </div>
  )
}