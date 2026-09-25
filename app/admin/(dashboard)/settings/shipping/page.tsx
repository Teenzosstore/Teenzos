import { getShippingSettings } from '@/actions/admin/shipping'
import ShippingForm from './_components/ShippingForm'

export const metadata = {
  title: 'Shipping Settings | Admin Dashboard',
}

export default async function ShippingSettingsPage() {
  const shipping = await getShippingSettings()

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">Shipping Settings</h1>
        <p className="mt-1 text-sm text-ink/60">
          Manage flat shipping rates and free shipping order thresholds.
        </p>
      </div>

      <div className="bg-panel p-6 rounded-2xl border border-cream-line shadow-sm">
        <ShippingForm initialShipping={shipping} />
      </div>
    </div>
  )
}
