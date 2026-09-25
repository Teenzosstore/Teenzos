import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Image from 'next/image'
import AuthForm from './_components/AuthForm'

export const metadata = {
  title: 'Login | TeenZos',
  description: 'Log in to your TeenZos account and continue your streetwear journey.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const { redirect, error } = await searchParams

  return (
    <>
      <Header />
      <main className="relative min-h-[calc(100vh-66px)] md:min-h-[calc(100vh-76px)] pt-[86px] sm:pt-[94px] md:pt-[106px] flex items-center justify-center overflow-hidden bg-white">
        {/* Full-bleed HD Splatter Background from images/autho_bg.webp */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/autho_bg.webp"
            alt="TeenZos Background"
            fill
            priority
            quality={95}
            sizes="100vw"
            className="object-cover object-center pointer-events-none select-none"
          />
        </div>

        {/* Centered Auth Card Container with compact vertical padding (py kam hi rakha hai) */}
        <div className="relative z-10 w-full max-w-[460px] mx-auto px-4 py-4 sm:py-6 md:py-8 flex items-center justify-center">
          <AuthForm redirectTo={redirect} initialError={error} />
        </div>
      </main>
      <Footer />
    </>
  )
}
