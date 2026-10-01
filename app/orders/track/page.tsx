import Header from '@/components/Header'
import Footer from '@/components/Footer'
import OrderTrackerClient from './_components/OrderTrackerClient'

export const metadata = {
  title: 'Track Order & Order History | Teenzosstore',
  description: 'Track your Teenzosstore order in real time or view your past order history.',
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; contact?: string }>
}) {
  const params = await searchParams

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F7F7F5] pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-wrap mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink">Customer Support</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mt-3 tracking-tight">
              Order Tracking &amp; History
            </h1>
          </div>

          <OrderTrackerClient
            initialOrderNumber={params?.orderNumber || ''}
            initialContact={params?.contact || ''}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
