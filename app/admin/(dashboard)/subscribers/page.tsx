import { getSubscribers } from '@/actions/admin/subscribers'
import SubscribersManager from './_components/SubscribersManager'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Subscribers & Email Marketing | Admin Dashboard',
  description: 'Manage newsletter subscribers and send drop alert & offer campaigns.',
}

export default async function SubscribersPage() {
  const result = await getSubscribers()
  const subscribers = result.subscribers || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          Email Subscribers & VIP Club
        </h1>
        <p className="text-sm text-ink/60 mt-1">
          Manage customers subscribed via the storefront newsletter pill container and send drop notifications or discount offers.
        </p>
      </div>

      <SubscribersManager initialSubscribers={subscribers} />
    </div>
  )
}
