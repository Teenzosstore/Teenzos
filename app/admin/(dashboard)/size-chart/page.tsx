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
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-cream-line/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Size Chart Management</h1>
          <p className="text-ink/60 text-xs sm:text-sm mt-0.5">
            Configure the universal size guide displayed across all products on the storefront.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold/10 text-gold-light border border-gold/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {initialCharts.length} {initialCharts.length === 1 ? 'Chart' : 'Charts'} Available
          </span>
        </div>
      </div>
      <SizeChartManager initialCharts={initialCharts} />
    </div>
  )
}