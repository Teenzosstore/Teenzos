import { getAboutSectionSettings } from '@/actions/admin/aboutSection'
import { AboutSectionForm } from './_components/AboutSectionForm'

export const metadata = {
  title: 'About Section | Admin Dashboard',
}

export default async function AdminAboutSectionPage() {
  const settings = await getAboutSectionSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">About Section</h1>
        <p className="text-sm text-ink/60 mt-1">
          Manage the About page story image, copy, badge, and stats.
        </p>
      </div>

      <AboutSectionForm initialSettings={settings} />
    </div>
  )
}
