import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Image from 'next/image'
import ResetPasswordForm from './_components/ResetPasswordForm'

export const metadata = {
  title: 'Reset Password | TeenZos',
  description: 'Choose a new password for your TeenZos account.',
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <>
      <Header />
      <main className="relative min-h-[calc(100vh-66px)] md:min-h-[calc(100vh-76px)] pt-[86px] sm:pt-[94px] md:pt-[106px] flex items-center justify-center overflow-hidden bg-white">
        {/* Full-bleed HD Splatter Background, same as /login */}
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

        <div className="relative z-10 w-full max-w-[460px] mx-auto px-4 py-4 sm:py-6 md:py-8 flex items-center justify-center">
          <ResetPasswordForm token={token || ''} />
        </div>
      </main>
      <Footer />
    </>
  )
}
