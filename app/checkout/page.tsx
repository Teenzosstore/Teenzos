import { getShippingSettings } from '@/actions/admin/shipping'
import { getCoupons } from '@/actions/admin/coupons'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CheckoutForm from './_components/CheckoutForm'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Secure Checkout | Teenzosstore',
}

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const shipping = await getShippingSettings()
  const coupons = await getCoupons()
  const hasCoupons = coupons.some(c => c.is_active)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F7F7F5] pt-24 pb-28 sm:pb-32 md:pt-32 md:pb-24">
        <div className="max-w-wrap mx-auto px-4 sm:px-6 md:px-8">
          <CheckoutForm shipping={shipping} isLoggedIn={!!user} hasCoupons={hasCoupons} />
        </div>
      </main>
      <Footer />
    </>
  )
}
