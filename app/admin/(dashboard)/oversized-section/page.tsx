import { getOversizedSectionSettings } from '@/actions/admin/oversizedSection'
import { OversizedSectionForm } from './_components/OversizedSectionForm'

export const metadata = {
  title: 'Oversized Section | Admin Dashboard',
}

export default async function AdminOversizedSectionPage() {
  const settings = await getOversizedSectionSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Oversized Section</h1>
        <p className="text-sm text-ink/60 mt-1">
          Manage the homepage oversized promo image, text, and button.
        </p>
      </div>

      <OversizedSectionForm initialSettings={settings} />
    </div>
  )
}
