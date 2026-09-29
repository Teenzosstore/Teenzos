import { getHeroLeftText, getHeroSlides } from '@/actions/admin/hero'
import { HeroManager } from './_components/HeroManager'

export const metadata = {
  title: 'Hero Section | Admin Dashboard',
}

export default async function AdminHeroSlidesPage() {
  const [slides, heroLeftText] = await Promise.all([
    getHeroSlides(),
    getHeroLeftText(),
  ])

  const rightSlides = slides.filter((s: any) => !s.position || s.position === 'right')

  return (
    <HeroManager
      initialText={heroLeftText}
      initialSlides={rightSlides}
    />
  )
}
