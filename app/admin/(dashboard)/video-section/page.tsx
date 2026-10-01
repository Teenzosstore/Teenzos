import {
  getAdminShoppableVideos,
  getProductOptions,
  getVideoSectionSettings,
} from '@/actions/admin/shoppableVideos'
import { VideoSectionManager } from './_components/VideoSectionManager'

export const metadata = {
  title: 'Video Section | Admin Dashboard',
}

export const dynamic = 'force-dynamic'

export default async function AdminVideoSectionPage() {
  const [{ videos, error }, products, settings] = await Promise.all([
    getAdminShoppableVideos(),
    getProductOptions(),
    getVideoSectionSettings(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Video Section</h1>
        <p className="text-sm text-ink/60 mt-1">
          Shoppable videos on the homepage — each video is mapped to a product, so shoppers can watch and tap straight
          through to buy.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">{error}</div>
      )}

      <VideoSectionManager initialVideos={videos} products={products} initialSettings={settings} />
    </div>
  )
}
