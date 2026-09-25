import { getAdminProfile } from '@/actions/admin/profile'
import ProfileForm from './_components/ProfileForm'

export const metadata = {
  title: 'Manage Profile | Admin Dashboard',
}

export default async function ManageProfilePage() {
  const profile = await getAdminProfile()

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">Manage Profile</h1>
        <p className="mt-1 text-sm text-ink/60">
          Update your administration details and contact information.
        </p>
      </div>

      <div className="bg-panel p-6 rounded-2xl border border-cream-line shadow-sm">
        <ProfileForm initialProfile={profile} />
      </div>
    </div>
  )
}
