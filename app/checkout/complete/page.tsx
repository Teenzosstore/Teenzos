import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ClearCartOnSuccess from './_components/ClearCartOnSuccess'

export const metadata = {
  title: 'Order Status | Teenzosstore',
}

export const dynamic = 'force-dynamic'

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order: orderNumber } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let order: { order_number: string; payment_status: string; total_amount: number; razorpay_payment_id: string | null } | null = null
  if (user && orderNumber) {
    const { data } = await supabase
      .from('orders')
      .select('order_number, payment_status, total_amount, razorpay_payment_id')
      .eq('order_number', orderNumber)
      .eq('user_id', user.id)
      .maybeSingle()
    order = data
  }

  // The session cookie can lag by a request right after the browser verifies
  // a Razorpay payment and redirects here (fresh login/OTP sessions, or a
  // cookie that hasn't round-tripped yet) — don't show a just-paid order as
  // failed just because this one request couldn't read the session. Fall
  // back to a direct, just-paid lookup, scoped tightly by time so an old or
  // guessed order number can't be used to pull up someone else's order.
  if (!order && orderNumber) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('orders')
      .select('order_number, payment_status, total_amount, razorpay_payment_id, paid_at')
      .eq('order_number', orderNumber)
      .eq('payment_status', 'paid')
      .maybeSingle()

    if (data?.paid_at && Date.now() - new Date(data.paid_at).getTime() < 30 * 60 * 1000) {
      order = data
    }
  }

  const isPaid = order?.payment_status === 'paid'

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F7F7F5] pt-24 pb-28 sm:pb-32 md:pt-32 md:pb-24">
        <div className="max-w-wrap mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-soft text-center space-y-6 mt-4 sm:mt-6">
            {isPaid && order ? (
              <>
                <ClearCartOnSuccess />
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                    PAYMENT SUCCESSFUL!
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Thank you for shopping with Teenzos. Your order is confirmed.
                  </p>
                </div>
                <div className="p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100 text-left space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500 uppercase font-semibold">Order Number</span>
                    <span className="font-bold text-gray-900">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500 uppercase font-semibold">Amount Paid</span>
                    <span className="font-bold text-emerald-600">
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {order.razorpay_payment_id && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500 uppercase font-semibold">Payment ID</span>
                      <span className="font-bold text-gray-900">{order.razorpay_payment_id}</span>
                    </div>
                  )}
                </div>
                <Link
                  href="/profile"
                  className="w-full inline-flex items-center justify-center py-3.5 px-4 bg-[#0B0D0E] hover:bg-[#F72585] text-white font-bold rounded-2xl transition-all uppercase tracking-wider text-xs sm:text-sm"
                >
                  View My Orders
                </Link>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                    PAYMENT NOT COMPLETED
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    {order
                      ? "Your payment didn't go through. Any amount debited will be refunded automatically. Please try again."
                      : "We couldn't find this order, or you're not signed in to the account that placed it."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/checkout"
                    className="flex-1 inline-flex items-center justify-center py-3.5 px-4 bg-[#0B0D0E] hover:bg-[#F72585] text-white font-bold rounded-2xl transition-all uppercase tracking-wider text-xs sm:text-sm"
                  >
                    Try Again
                  </Link>
                  <Link
                    href="/profile"
                    className="flex-1 inline-flex items-center justify-center py-3.5 px-4 border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-2xl transition-all uppercase tracking-wider text-xs sm:text-sm"
                  >
                    My Orders
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
