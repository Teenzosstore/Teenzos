import { getLookbookImages } from '@/actions/admin/lookbook'
import { LookbookManager } from './_components/LookbookManager'

export const metadata = {
  title: 'Lookbook | Admin Dashboard',
}

export default async function AdminLookbookPage() {
  const images = await getLookbookImages()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Lookbook</h1>
        <p className="text-sm text-ink/60 mt-1">
          Manage the homepage Lookbook images and optional click-through links.
        </p>
      </div>

      <LookbookManager initialImages={images} />
    </div>
  )
}
