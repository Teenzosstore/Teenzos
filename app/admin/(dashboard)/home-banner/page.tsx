import { getHomeBannerEnabled, getHomeBannerImages } from '@/actions/admin/homeBanner'
import { HomeBannerManager } from './_components/HomeBannerManager'

export const metadata = {
  title: 'Home Banner | Admin Dashboard',
}

export default async function AdminHomeBannerPage() {
  const [enabled, images] = await Promise.all([
    getHomeBannerEnabled(),
    getHomeBannerImages(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Home Banner</h1>
        <p className="text-sm text-ink/60 mt-1">
          Manage the auto-swiping hero background shown at the top of the homepage.
        </p>
      </div>

      <HomeBannerManager initialEnabled={enabled} initialImages={images} />
    </div>
  )
}
