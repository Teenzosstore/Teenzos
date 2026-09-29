import { getAnnouncementsConfig } from '@/actions/admin/announcements'
import { getCoupons } from '@/actions/admin/coupons'
import { AnnouncementForm } from './_components/AnnouncementForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Announcement Marquee | Admin Dashboard',
}

export default async function AdminAnnouncementsPage() {
  const [config, coupons] = await Promise.all([
    getAnnouncementsConfig(),
    getCoupons(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Announcement Marquee</h1>
        <p className="text-sm text-ink/60 mt-1">
          Manage the top marquee ticker bar messages, dedicated coupon spotlight, badges, icons, and themes across the storefront.
        </p>
      </div>

      <AnnouncementForm initialConfig={config} availableCoupons={coupons || []} />
    </div>
  )
}
