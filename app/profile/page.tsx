import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CustomerAccountView, {
  CustomerProfileData,
  CustomerAddressData,
  CustomerOrderData,
} from './_components/CustomerAccountView'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseSignedRawflexSession, rawflexSessionCookieNames } from '@/lib/auth/session'

export const metadata = {
  title: 'Customer Account | TeenZos',
  description: 'Manage your TeenZos orders, live tracking, shipping addresses, and account settings.',
}

export default async function CustomerProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentUserId = user?.id
  let currentUserEmail = user?.email
  let currentUserName = (user?.user_metadata?.full_name as string) || null

  // Check fallback session cookie
  if (!user) {
    const cookieStore = await cookies()
    const sessionPayload = cookieStore.get(rawflexSessionCookieNames.session)?.value
    const sessionSig = cookieStore.get(rawflexSessionCookieNames.signature)?.value
    const customSession = parseSignedRawflexSession(sessionPayload, sessionSig)
    if (customSession?.id) {
      currentUserId = customSession.id
      currentUserEmail = customSession.email || null
      currentUserName = customSession.full_name || null
    }
  }

  // Secure Auth Guard: If not logged in, redirect to login page immediately
  if (!currentUserId) {
    redirect('/login?redirect=/profile')
  }

  let initialProfile: CustomerProfileData | null = null
  let initialAddresses: CustomerAddressData[] = []
  let initialOrders: CustomerOrderData[] = []

  const adminSupabase = createAdminClient()

  // 1. Fetch user profile
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', currentUserId)
    .maybeSingle()

  if (profile) {
    initialProfile = {
      id: profile.id,
      full_name: profile.full_name || currentUserName || '',
      email: profile.email || currentUserEmail || '',
      phone: profile.phone || '',
      avatar_url: profile.avatar_url || (user?.user_metadata?.avatar_url as string) || 'theme-pink',
    }
  } else {
    initialProfile = {
      id: currentUserId,
      full_name: currentUserName || '',
      email: currentUserEmail || '',
      phone: '',
      avatar_url: (user?.user_metadata?.avatar_url as string) || 'theme-pink',
    }
  }

  // 2. Fetch all user addresses
  const { data: addresses } = await adminSupabase
    .from('addresses')
    .select('*')
    .eq('user_id', currentUserId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (addresses && addresses.length > 0) {
    initialAddresses = addresses as CustomerAddressData[]
  }

  // 3. Fetch user orders with items
  const { data: userOrders } = await adminSupabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        price_at_purchase,
        quantity,
        line_total
      )
    `)
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false })

  if (userOrders && userOrders.length > 0) {
    // Collect product ids to attach images
    const productIds = Array.from(
      new Set(
        userOrders
          .flatMap((o) => o.order_items || [])
          .map((item) => item.product_id)
          .filter(Boolean)
      )
    )

    let productImagesMap: Record<string, string> = {}
    if (productIds.length > 0) {
      const { data: products } = await adminSupabase
        .from('products')
        .select('id, featured_image_url')
        .in('id', productIds)

      if (products) {
        products.forEach((p) => {
          if (p.featured_image_url) {
            productImagesMap[p.id] = p.featured_image_url
          }
        })
      }
    }

    initialOrders = userOrders.map((order) => ({
      ...order,
      order_items: (order.order_items || []).map((item: any) => ({
        ...item,
        image_url:
          (item.product_id && productImagesMap[item.product_id]) || '',
      })),
    })) as CustomerOrderData[]
  }

  return (
    <>
      <Header />
      <div className="pt-24 sm:pt-28 md:pt-32 bg-[#F8F9FA]">
        <CustomerAccountView
          initialUser={{
            id: currentUserId,
            email: currentUserEmail,
            full_name: currentUserName,
            avatar_url: initialProfile?.avatar_url || null,
          }}
          initialProfile={initialProfile}
          initialAddresses={initialAddresses}
          initialOrders={initialOrders}
          isLoggedIn={true}
        />
      </div>
      <Footer />
    </>
  )
}
