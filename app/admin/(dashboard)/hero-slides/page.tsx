import { getHeroLeftText, getHeroSlides } from '@/actions/admin/hero'
import { HeroLeftTextForm } from './_components/HeroLeftTextForm'
import { HeroSlideList } from './_components/HeroSlideList'

export const metadata = {
  title: 'Hero Section | Admin Dashboard',
}

export default async function AdminHeroSlidesPage() {
  const [slides, heroLeftText] = await Promise.all([
    getHeroSlides(),
    getHeroLeftText(),
  ])

  const rightSlides = slides.filter(s => !s.position || s.position === 'right')

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Hero Section</h1>
          <p className="text-sm text-ink/60 mt-1">
            Manage the homepage hero text and right-side hero cards.
          </p>
        </div>
      </div>

      <div className="max-w-5xl">
        <div className="mb-8">
          <HeroLeftTextForm initialText={heroLeftText} />
        </div>
        <HeroSlideList
          initialSlides={rightSlides}
          position="right"
          title="Hero Card Images"
        />
      </div>
    </div>
  )
}
