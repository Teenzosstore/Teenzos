import { listMediaImages } from '@/actions/admin/media'
import { MediaGallery } from './_components/MediaGallery'

export const metadata = {
  title: 'Media Library | Admin Dashboard',
}

export default async function AdminMediaPage() {
  const images = await listMediaImages()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Media Library</h1>
          <p className="text-sm text-ink/60 mt-1">
            All images uploaded to Supabase storage — sample/category product images, hero, banner and
            homepage assets. Click &quot;Copy URL&quot; to use an image in the admin.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/15 text-gold-light text-xs font-semibold">
          {images.length} images
        </span>
      </div>

      <MediaGallery images={images} />
    </div>
  )
}