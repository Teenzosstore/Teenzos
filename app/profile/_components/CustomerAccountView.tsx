'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  Package,
  Truck,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  ShoppingBag,
  CheckCircle2,
  Check,
  ChevronRight,
  Search,
  Lock,
  Plus,
  X,
  ArrowRight,
  ExternalLink,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  updateCustomerBasicProfile,
  updateCustomerPassword,
  saveCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  getLiveCustomerData,
} from '@/actions/profile'
import { logoutForClient } from '@/actions/auth'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import TrendingProductCard from '@/components/TrendingProductCard'
import { selectDisplayVariant } from '@/lib/productVariants'

// Types
export interface CustomerProfileData {
  id?: string
  full_name?: string
  email?: string
  phone?: string
  avatar_url?: string
}

export interface CustomerAddressData {
  id: string
  user_id?: string
  full_name: string
  phone: string
  alternate_phone?: string | null
  address_line_1: string
  address_line_2?: string | null
  city: string
  state: string
  postal_code: string
  country?: string
  is_default: boolean
}

export interface CustomerOrderItem {
  id: string
  product_id?: string
  variant_id?: string
  product_name: string
  variant_name?: string
  price_at_purchase: number
  quantity: number
  line_total: number
  image_url?: string
}

export interface CustomerOrderData {
  id: string
  order_number: string
  user_id?: string
  total_amount: number
  subtotal?: number
  shipping_cost?: number
  payment_status: string
  order_status: string
  payment_method?: string | null
  courier_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
  shipment_notes?: string | null
  created_at: string
  delivered_at?: string | null
  shipped_at?: string | null
  order_items?: CustomerOrderItem[]
}

interface CustomerAccountViewProps {
  initialUser: {
    id: string
    email: string | null
    full_name: string | null
    avatar_url?: string | null
  } | null
  initialProfile: CustomerProfileData | null
  initialAddresses: CustomerAddressData[]
  initialOrders: CustomerOrderData[]
  isLoggedIn: boolean
}

// Dynamic user-specific avatar background gradients (unique for each user)
const USER_AVATAR_GRADIENTS = [
  'bg-gradient-to-tr from-[#F72585] via-[#D91668] to-[#7209B7]', // Cyber Neon Pink
  'bg-gradient-to-tr from-[#36B8C5] via-[#218D98] to-[#0B0D0E]', // Electric Cyan
  'bg-gradient-to-tr from-[#FF5E7E] via-[#FF8C00] to-[#FFAA00]', // Sunset Glow
  'bg-gradient-to-tr from-[#7B2CBF] via-[#9D4EDD] to-[#3A0CA3]', // Matrix Violet
  'bg-gradient-to-tr from-[#10B981] via-[#059669] to-[#064E3B]', // Toxic Emerald
  'bg-gradient-to-tr from-[#4361EE] via-[#3F37C9] to-[#1E1B4B]', // Royal Blue
  'bg-gradient-to-tr from-[#EF4444] via-[#DC2626] to-[#7F1D1D]', // Fiery Red
  'bg-gradient-to-tr from-[#F59E0B] via-[#D97706] to-[#78350F]', // Amber Gold
]

function getDynamicUserGradient(identifier?: string | null): string {
  if (!identifier) return USER_AVATAR_GRADIENTS[0]
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % USER_AVATAR_GRADIENTS.length
  return USER_AVATAR_GRADIENTS[index]
}

export default function CustomerAccountView({
  initialUser,
  initialProfile,
  initialAddresses,
  initialOrders,
  isLoggedIn,
}: CustomerAccountViewProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { addToCart, openCart } = useCart()

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'profile' | 'orders' | 'wishlist' | 'addresses' | 'settings'
  >('profile')

  // Live state (100% Real Supabase Data)
  const [user, setUser] = useState(initialUser)
  const [profile, setProfile] = useState<CustomerProfileData>(() => ({
    full_name: initialProfile?.full_name || initialUser?.full_name || 'User',
    email: initialProfile?.email || initialUser?.email || 'user@example.com',
    phone: initialProfile?.phone || '',
  }))
  const [addresses, setAddresses] = useState<CustomerAddressData[]>(initialAddresses || [])
  const [orders, setOrders] = useState<CustomerOrderData[]>(initialOrders || [])

  // Live wishlist count from localStorage
  const [wishlistCount, setWishlistCount] = useState(0)
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [dbProducts, setDbProducts] = useState<any[]>([])

  // Selected Product Information Modal state
  const [selectedProductItem, setSelectedProductItem] = useState<{
    item: CustomerOrderItem
    order: CustomerOrderData
  } | null>(null)

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  // Form states
  const [editProfileForm, setEditProfileForm] = useState({
    fullName: profile.full_name || '',
    phone: profile.phone || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [addressForm, setAddressForm] = useState<{
    id?: string
    fullName: string
    phone: string
    alternatePhone: string
    street: string
    addressLine2: string
    city: string
    state: string
    zipCode: string
    isDefault: boolean
  }>({
    fullName: '',
    phone: '',
    alternatePhone: '',
    street: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  })

  const [isSaving, setIsSaving] = useState(false)

  // Dynamic user avatar background (changes dynamically per user)
  const userAvatarBg = useMemo(() => {
    return getDynamicUserGradient(profile.email || user?.id || profile.full_name || 'user')
  }, [profile.email, user?.id, profile.full_name])

  // Fetch live products from Supabase to ensure all items in wishlist are fully populated
  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, slug, category_id, is_featured, is_active, badge, rating, review_count, color_name, price, "oldPrice", featured_image_url,
            product_images ( image_url ),
            product_variants ( id, variant_name, price, original_price, stock_quantity, is_active )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data)) {
          const { data: categoryRows } = await supabase.from('categories').select('id, name')
          const categoryNames = new Map<string, string>(
            (categoryRows || []).map((c: any) => [c.id, c.name] as [string, string])
          )

          // Everything below comes straight from the product rows — price from
          // the live variant, discount only when a real original price exists.
          const formatted = data.map((p: any) => {
            const variant = selectDisplayVariant(p.product_variants)
            const price = Number(p.price || variant?.price || 0)
            const original = p.oldPrice ? Number(p.oldPrice) : variant?.original_price ? Number(variant.original_price) : null
            const hasDiscount = original !== null && original > price
            const activeVariants = (p.product_variants || []).filter((v: any) => v.is_active !== false)

            return {
              id: p.id,
              variant_id: variant?.id || null,
              slug: p.slug || p.id,
              name: p.name,
              category_id: p.category_id,
              category_name: categoryNames.get(p.category_id) || '',
              price,
              oldPrice: hasDiscount ? original : undefined,
              discount: hasDiscount ? `${Math.round((((original as number) - price) / (original as number)) * 100)}% OFF` : undefined,
              image_url: p.featured_image_url || p.product_images?.[0]?.image_url || '',
              badge: p.badge || undefined,
              rating: Number(p.rating) || 0,
              review_count: Number(p.review_count) || 0,
              sizes: Array.from(new Set(activeVariants.map((v: any) => v.variant_name).filter(Boolean))),
              in_stock: activeVariants.some((v: any) => (v.stock_quantity || 0) > 0),
              is_active: true,
              color_name: p.color_name,
              product_images: p.product_images,
              gallery_images: (p.product_images || []).map((img: any) => img.image_url),
              product_variants: p.product_variants,
            }
          })
          setDbProducts(formatted)
        }
      } catch (err) {
        console.warn('Could not fetch DB products for profile wishlist:', err)
      }
    }
    fetchProducts()
  }, [])

  // Sync wishlist from localStorage & listen for changes
  useEffect(() => {
    function loadWishlist() {
      try {
        const saved = localStorage.getItem('teenzos_wishlist')
        const activeMap: Record<string, boolean> = {}
        if (saved) {
          const parsed = JSON.parse(saved)
          Object.keys(parsed).forEach((k) => {
            if (parsed[k]) activeMap[k] = true
          })
        }
        const activeIds = Object.keys(activeMap)
        setWishlistCount(activeIds.length)

        let cachedMap: Record<string, any> = {}
        const cachedRaw = localStorage.getItem('teenzos_wishlist_products')
        if (cachedRaw) {
          try {
            cachedMap = JSON.parse(cachedRaw)
          } catch {}
        }

        const list: any[] = []
        const foundIds = new Set<string>()

        // 1. Check cached products in localStorage
        activeIds.forEach((id) => {
          if (cachedMap[id] && !foundIds.has(id)) {
            list.push(cachedMap[id])
            foundIds.add(id)
          }
        })

        // 2. Check live DB products
        dbProducts.forEach((p) => {
          if (activeMap[p.id] && !foundIds.has(p.id)) {
            list.push(p)
            foundIds.add(p.id)
          }
        })

        setWishlistItems(list)
      } catch (e) {
        // ignore fallback
      }
    }
    loadWishlist()
    window.addEventListener('teenzos-wishlist-change', loadWishlist)
    window.addEventListener('storage', loadWishlist)
    return () => {
      window.removeEventListener('teenzos-wishlist-change', loadWishlist)
      window.removeEventListener('storage', loadWishlist)
    }
  }, [dbProducts])

  // Remove product from wishlist via card heart button
  const handleToggleWishlistFromCard = (productId: string) => {
    try {
      let currentMap: Record<string, boolean> = {}
      const saved = localStorage.getItem('teenzos_wishlist')
      if (saved) currentMap = JSON.parse(saved)
      delete currentMap[productId]
      localStorage.setItem('teenzos_wishlist', JSON.stringify(currentMap))

      let cachedProducts: Record<string, any> = {}
      try {
        const raw = localStorage.getItem('teenzos_wishlist_products')
        if (raw) cachedProducts = JSON.parse(raw)
      } catch {}
      delete cachedProducts[productId]
      localStorage.setItem('teenzos_wishlist_products', JSON.stringify(cachedProducts))

      window.dispatchEvent(new Event('teenzos-wishlist-change'))
      setWishlistItems((prev) => prev.filter((p) => p.id !== productId))
      setWishlistCount((prev) => Math.max(0, prev - 1))
      showToast('Removed from wishlist', 'info')
    } catch (err) {
      console.error('Wishlist toggle error:', err)
    }
  }

  // Supabase Real-time updates subscription for current user
  useEffect(() => {
    if (!user?.id) return

    try {
      const supabase = createClient()
      const channel = supabase
        .channel(`customer-account-live-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          async () => {
            const fresh = await getLiveCustomerData()
            if (fresh.success && fresh.orders && fresh.orders.length > 0) {
              const freshOrders = fresh.orders as CustomerOrderData[]
              setOrders(freshOrders)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          async () => {
            const fresh = await getLiveCustomerData()
            if (fresh.success && fresh.profile) {
              setProfile((prev) => ({
                ...prev,
                full_name: fresh.profile.full_name || prev.full_name,
                phone: fresh.profile.phone || prev.phone,
              }))
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'addresses', filter: `user_id=eq.${user.id}` },
          async () => {
            const fresh = await getLiveCustomerData()
            if (fresh.success && fresh.addresses && fresh.addresses.length > 0) {
              setAddresses(fresh.addresses as CustomerAddressData[])
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (err) {
      console.warn('Realtime channel initialization error:', err)
    }
  }, [user?.id])

  // Stat metrics (100% Real Supabase Data)
  const stats = useMemo(() => {
    const total = orders.length
    const inTransit = orders.filter((o) => {
      const s = (o.order_status || '').toLowerCase()
      return s === 'shipped' || s === 'in transit' || s === 'in_transit' || s === 'processing' || s === 'out for delivery' || s === 'out_for_delivery'
    }).length
    const delivered = orders.filter((o) => (o.order_status || '').toLowerCase() === 'delivered').length

    return {
      total,
      inTransit,
      delivered,
      wishlist: wishlistCount,
    }
  }, [orders, wishlistCount])

  // Default address (100% Real Supabase Data)
  const defaultAddress = useMemo(() => {
    return addresses.find((a) => a.is_default) || addresses[0] || null
  }, [addresses])

  // Helper date formatter
  const formatDate = (isoString?: string) => {
    if (!isoString) return '—'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch (e) {
      return isoString
    }
  }

  // Handle "Buy Again"
  const handleBuyAgain = (order: CustomerOrderData) => {
    if (!order.order_items || order.order_items.length === 0) {
      showToast('Product details unavailable for re-order', 'error')
      return
    }

    // Re-add every line with its real variant and quantity.
    order.order_items.forEach((item) => {
      addToCart(
        {
          id: item.product_id || item.id,
          variant_id: item.variant_id,
          name: item.product_name,
          price: Number(item.price_at_purchase),
          image_url: item.image_url || '',
          variant_name: item.variant_name || undefined,
        },
        { quantity: item.quantity, skipFly: true }
      )
    })

    const totalUnits = order.order_items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    showToast(`Added ${totalUnits} ${totalUnits === 1 ? 'item' : 'items'} to your bag!`, 'success')
    openCart()
  }

  // Handle Logout
  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Client signout error:', err)
    }
    try {
      await logoutForClient()
    } catch (e) {
      console.error('Logout error:', e)
    }
    localStorage.removeItem('rawflex-customer-profile')
    showToast('Logged out successfully', 'info')
    window.location.href = '/login'
  }

  // Handle Save Profile to Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const res = await updateCustomerBasicProfile({
      fullName: editProfileForm.fullName,
      phone: editProfileForm.phone,
    })

    setIsSaving(false)

    if (res.error) {
      showToast(res.error, 'error')
      return
    }

    setProfile((prev) => ({
      ...prev,
      full_name: editProfileForm.fullName,
      phone: editProfileForm.phone,
    }))
    setIsEditProfileOpen(false)
    showToast('Profile updated in Supabase successfully!', 'success')
  }

  // Handle Change Password in Supabase
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    setIsSaving(true)
    const res = await updateCustomerPassword(passwordForm.newPassword)
    setIsSaving(false)

    if (res.error) {
      showToast(res.error, 'error')
      return
    }

    setPasswordForm({ newPassword: '', confirmPassword: '' })
    setIsChangePasswordOpen(false)
    showToast('Password changed successfully!', 'success')
  }

  // Handle Save / Add Address in Supabase
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const res = await saveCustomerAddress({
      id: addressForm.id,
      fullName: addressForm.fullName,
      phone: addressForm.phone,
      alternatePhone: addressForm.alternatePhone,
      street: addressForm.street,
      addressLine2: addressForm.addressLine2,
      city: addressForm.city,
      state: addressForm.state,
      zipCode: addressForm.zipCode,
      isDefault: addressForm.isDefault,
    })

    setIsSaving(false)

    if (res.error) {
      showToast(res.error, 'error')
      return
    }

    if (addressForm.id) {
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === addressForm.id
            ? {
                ...addr,
                full_name: addressForm.fullName,
                phone: addressForm.phone,
                alternate_phone: addressForm.alternatePhone,
                address_line_1: addressForm.street,
                address_line_2: addressForm.addressLine2,
                city: addressForm.city,
                state: addressForm.state,
                postal_code: addressForm.zipCode,
                is_default: addressForm.isDefault,
              }
            : addressForm.isDefault
            ? { ...addr, is_default: false }
            : addr
        )
      )
    } else {
      const newAddress: CustomerAddressData = {
        id: `addr-${Date.now()}`,
        full_name: addressForm.fullName,
        phone: addressForm.phone,
        alternate_phone: addressForm.alternatePhone,
        address_line_1: addressForm.street,
        address_line_2: addressForm.addressLine2,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.zipCode,
        is_default: addressForm.isDefault || addresses.length === 0,
      }
      setAddresses((prev) =>
        addressForm.isDefault ? [newAddress, ...prev.map((a) => ({ ...a, is_default: false }))] : [...prev, newAddress]
      )
    }

    setIsAddressModalOpen(false)
    showToast('Address saved in Supabase successfully!', 'success')
  }

  // Handle Delete Address in Supabase
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    const res = await deleteCustomerAddress(addressId)
    if (res.error) {
      showToast(res.error, 'error')
      return
    }

    setAddresses((prev) => prev.filter((a) => a.id !== addressId))
    showToast('Address deleted', 'info')
  }

  // Handle Set Default Address in Supabase
  const handleSetDefaultAddress = async (addressId: string) => {
    const res = await setDefaultCustomerAddress(addressId)
    if (res.error) {
      showToast(res.error, 'error')
      return
    }

    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        is_default: a.id === addressId,
      }))
    )
    showToast('Default address updated!', 'success')
  }

  // Navigation Items
  const navTabs = [
    { key: 'profile', label: 'My Profile', icon: User },
    { key: 'orders', label: 'My Orders', icon: Package },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
    { key: 'settings', label: 'Settings', icon: Settings },
  ] as const

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111315] font-sans antialiased pb-20 selection:bg-pink selection:text-white">
      {/* Main Container */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Mobile Horizontal Tabs Navigator */}
        <div className="lg:hidden mb-6 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-2 min-w-max">
            {navTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-pink text-white shadow-pink'
                      : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold bg-white text-gray-500 border border-gray-200 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Dual-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
          {/* ══════════════════════════════════════════════════
              LEFT SIDEBAR (Desktop)
             ══════════════════════════════════════════════════ */}
          <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white rounded-[5px] p-6 border border-gray-200/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden shrink-0 min-h-[680px]">
            {/* User Profile Header with Dynamic User-Specific Gradient Background & Person Icon */}
            <div className="text-center pt-2 pb-5 border-b border-gray-100">
              <div className="relative w-24 h-24 mx-auto rounded-full p-1 border-2 border-pink/30 shadow-md bg-white">
                <div
                  className={`w-full h-full rounded-full overflow-hidden relative flex items-center justify-center select-none shadow-inner ${userAvatarBg}`}
                >
                  <User className="w-10 h-10 text-white drop-shadow-md" strokeWidth={2.2} />
                </div>
              </div>

              <h2 className="mt-3.5 text-lg font-bold text-gray-900 tracking-tight truncate px-2">
                {profile.full_name || 'User'}
              </h2>
              <p className="text-xs text-gray-400 font-medium truncate px-2 mt-0.5">
                {profile.email || 'user@example.com'}
              </p>
            </div>

            {/* Navigation Tab Links */}
            <nav className="mt-5 space-y-1.5 flex-1 relative z-10">
              {navTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-[5px] text-[13px] font-semibold transition-all ${
                      isActive
                        ? 'bg-pink text-white shadow-[0_6px_20px_rgba(247,37,133,0.35)]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-[5px] text-[13px] font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50/70 transition-all mt-4"
              >
                <LogOut className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Logout</span>
              </button>
            </nav>

            {/* Bottom Left Paint Splatter Art Decoration (from bg_image.png) */}
            <div className="absolute -bottom-8 -left-8 w-44 h-44 pointer-events-none select-none opacity-85 overflow-hidden z-0">
              <Image
                src="/images/bg_image.png"
                alt="Paint Splatter Decor"
                width={280}
                height={280}
                className="w-full h-full object-cover object-bottom -rotate-6 scale-150 transform"
              />
            </div>
          </aside>

          {/* ══════════════════════════════════════════════════
              RIGHT MAIN CONTENT AREA
             ══════════════════════════════════════════════════ */}
          <main className="flex-1 w-full min-w-0">
            {/* If on a tab other than 'profile', show a return to dashboard breadcrumb */}
            {activeTab !== 'profile' && (
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-pink transition-colors border border-gray-200/70 p-2.5 rounded-[5px]"
                >
                  ← Back to Account Dashboard
                </button>
                <span className="text-xs uppercase font-extrabold tracking-wider text-pink">
                  {activeTab.toUpperCase()} VIEW
                </span>
              </div>
            )}

            {/* TAB: DASHBOARD */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* 1. TOP WELCOME BANNER (uses bg_image.png) */}
                <div className="relative rounded-[5px] bg-white border border-gray-200/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] overflow-hidden min-h-[170px] sm:min-h-[195px] flex items-center p-6 sm:p-8 md:p-10">
                  {/* Right side banner artwork (bg_image.png with soft left fade) */}
                  <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/5 md:w-1/2 pointer-events-none select-none overflow-hidden">
                    <Image
                      src="/images/bg_image.png"
                      alt="TeenZos Graffiti Streetwear Artwork"
                      fill
                      priority
                      className="object-cover object-right"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent sm:via-white/55" />
                  </div>

                  {/* Left Content text */}
                  <div className="relative z-10 max-w-md sm:max-w-lg flex items-center gap-3.5 sm:gap-4">
                    {/* Mobile-visible user dynamic avatar with Person icon */}
                    <div className="lg:hidden shrink-0">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center shadow-md border-2 border-white ring-2 ring-pink/30 bg-gradient-to-tr from-pink to-[#36B8C5] ${userAvatarBg || ''}`}>
                        <User className="w-6 h-6 text-white drop-shadow-sm" strokeWidth={2.4} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight font-sans truncate">
                        Hello{profile.full_name || user?.full_name ? `, ${profile.full_name || user?.full_name}` : ''} 👋
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 font-normal leading-relaxed line-clamp-2">
                        Manage your orders, addresses, and account settings all in one place.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. STATS ROW (4 cards in a row) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                  {/* Total Orders */}
                  <div
                    onClick={() => setActiveTab('orders')}
                    className="bg-white rounded-[5px] p-4 sm:p-5 border border-gray-200/70 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-[5px] bg-pink-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-5 h-5 text-pink" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                        {stats.total}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-1">Total Orders</div>
                    </div>
                  </div>

                  {/* In Transit */}
                  <div
                    onClick={() => setActiveTab('orders')}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/70 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-[5px] bg-cyan-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Truck className="w-5 h-5 text-[#36B8C5]" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                        {stats.inTransit}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-1">In Transit</div>
                    </div>
                  </div>

                  {/* Delivered */}
                  <div
                    onClick={() => setActiveTab('orders')}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/70 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-[5px] bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                        {stats.delivered}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-1">Delivered</div>
                    </div>
                  </div>

                  {/* Wishlist Items */}
                  <div
                    onClick={() => setActiveTab('wishlist')}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/70 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-[5px] bg-pink-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Heart className="w-5 h-5 text-pink" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                        {stats.wishlist}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-1">Wishlist Items</div>
                    </div>
                  </div>
                </div>

                {/* 3. RECENT ORDERS (Dedicated Full-Width Container) */}
                <div className="bg-white rounded-[5px] p-6 sm:p-8 border border-gray-200/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-[5px] bg-pink-50 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-pink" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Recent Orders</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Your most recent purchases & delivery updates</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-pink hover:text-[#d91668] flex items-center gap-1 transition-colors"
                    >
                      View All
                    </button>
                  </div>

                  {/* Orders List */}
                  <div className="space-y-3.5 pt-1">
                    {orders.length > 0 ? (
                      orders.slice(0, 3).map((order, idx) => {
                        const firstItem = order.order_items?.[0]
                        const status = order.order_status?.toLowerCase() || 'pending'
                        const isItemDelivered = status === 'delivered'
                        const isItemInTransit =
                          status === 'shipped' ||
                          status === 'in transit' ||
                          status === 'in_transit' ||
                          status === 'processing' ||
                          status === 'out for delivery'

                        const itemThumb = firstItem?.image_url || ''

                        return (
                          <div
                            key={order.id || order.order_number}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all"
                          >
                            <div
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="flex items-center gap-3.5 min-w-0 cursor-pointer group"
                              title="View order details & tracking"
                            >
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[5px] bg-gray-50 overflow-hidden relative shrink-0 border border-gray-100 group-hover:border-pink transition-colors flex items-center justify-center">
                                {itemThumb ? (
                                  <Image
                                    src={itemThumb}
                                    alt={firstItem?.product_name || order.order_number}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-300" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-pink transition-colors truncate">
                                    {firstItem?.product_name || `Order #${order.order_number}`}
                                  </h3>
                                  <span className="text-[10px] text-pink bg-pink-50 font-bold px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    Details
                                  </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                                  {formatDate(order.created_at)}
                                </p>
                                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                                  {firstItem?.variant_name ? `${firstItem.variant_name} • ` : ''}
                                  {(() => {
                                    const units = (order.order_items || []).reduce(
                                      (sum, item) => sum + (Number(item.quantity) || 1),
                                      0
                                    )
                                    return `${units} ${units === 1 ? 'item' : 'items'}`
                                  })()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                              {/* Status Badge */}
                              {isItemDelivered ? (
                                <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Delivered
                                </span>
                              ) : status === 'cancelled' ? (
                                <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                                  Cancelled
                                </span>
                              ) : status === 'shipped' || status === 'in transit' || status === 'in_transit' || status === 'out for delivery' ? (
                                <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#218D98] border border-cyan-100 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#36B8C5] animate-pulse" />
                                  {status === 'shipped' ? 'Shipped' : 'In Transit'}
                                </span>
                              ) : status === 'processing' ? (
                                <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                                  Processing
                                </span>
                              ) : (
                                <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                  Order Placed
                                </span>
                              )}

                              {/* Price */}
                              <span className="text-xs sm:text-sm font-bold text-gray-900">
                                ₹{Number(order.total_amount).toLocaleString('en-IN')}
                              </span>

                              {/* Action Button */}
                              <Link
                                href={`/orders/${order.id}`}
                                className="bg-black hover:bg-pink text-white text-xs font-bold px-4 py-1.5 rounded-full transition-all whitespace-nowrap"
                              >
                                View Details
                              </Link>
                              {isItemDelivered && (
                                <button
                                  onClick={() => handleBuyAgain(order)}
                                  className="text-xs font-semibold text-pink border border-pink hover:bg-pink hover:text-white px-3.5 py-1.5 rounded-full transition-all shadow-2xs whitespace-nowrap"
                                >
                                  Buy Again
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-10 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto text-pink">
                          <ShoppingBag className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">No Orders Placed Yet</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                          Your live orders from Supabase will appear here once you place a checkout.
                        </p>
                        <Link
                          href="/shop"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink text-white rounded-[5px] text-xs font-bold shadow-pink hover:bg-[#d91668] transition-all"
                        >
                          Explore New Drops →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM ROW: 2 Cards (Manage Addresses, Account Settings) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Manage Addresses */}
                  <div className="bg-white rounded-[5px] p-6 border border-gray-200/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4.5 h-4.5 text-pink" />
                          <h2 className="text-base font-bold text-gray-900 tracking-tight">Manage Addresses</h2>
                        </div>
                        <button
                          onClick={() => setActiveTab('addresses')}
                          className="text-xs font-bold text-pink hover:text-[#d91668] flex items-center gap-1 transition-colors"
                        >
                          View All
                        </button>
                      </div>

                      {/* Default Address Container */}
                      {addresses.length > 0 && defaultAddress ? (
                        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <span className="bg-pink text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                              Default
                            </span>
                            <button
                              onClick={() => {
                                setAddressForm({
                                  id: defaultAddress.id,
                                  fullName: defaultAddress.full_name || profile.full_name || '',
                                  phone: defaultAddress.phone || profile.phone || '',
                                  alternatePhone: defaultAddress.alternate_phone || '',
                                  street: defaultAddress.address_line_1 || '',
                                  addressLine2: defaultAddress.address_line_2 || '',
                                  city: defaultAddress.city || '',
                                  state: defaultAddress.state || '',
                                  zipCode: defaultAddress.postal_code || '',
                                  isDefault: true,
                                })
                                setIsAddressModalOpen(true)
                              }}
                              className="border border-gray-200 hover:border-gray-400 text-gray-700 bg-white hover:bg-gray-50 px-3.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="font-bold text-sm text-gray-900">{defaultAddress.address_line_1}</div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {defaultAddress.address_line_2 ? `${defaultAddress.address_line_2}, ` : ''}
                            {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.postal_code}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center space-y-2">
                          <p className="text-xs text-gray-500">No delivery address saved yet.</p>
                          <button
                            onClick={() => {
                              setAddressForm({
                                fullName: profile.full_name || '',
                                phone: profile.phone || '',
                                alternatePhone: '',
                                street: '',
                                addressLine2: '',
                                city: '',
                                state: '',
                                zipCode: '',
                                isDefault: true,
                              })
                              setIsAddressModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-pink text-white rounded-[5px] text-xs font-bold shadow-pink hover:bg-[#d91668] transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Account Settings */}
                  <div className="bg-white rounded-[5px] p-6 border border-gray-200/70 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                        <Settings className="w-4.5 h-4.5 text-pink" />
                        <h2 className="text-base font-bold text-gray-900 tracking-tight">Account Settings</h2>
                      </div>

                      {/* Settings List */}
                      <div className="mt-2 space-y-1">
                        <button
                          onClick={() => {
                            setEditProfileForm({
                              fullName: profile.full_name || '',
                              phone: profile.phone || '',
                            })
                            setIsEditProfileOpen(true)
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-[5px] hover:bg-gray-50 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-400 group-hover:text-pink transition-colors" />
                            <span className="text-xs sm:text-[13px] font-semibold text-gray-800">Edit Profile</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          onClick={() => setIsChangePasswordOpen(true)}
                          className="w-full flex items-center justify-between p-2.5 rounded-[5px] hover:bg-gray-50 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-gray-400 group-hover:text-pink transition-colors" />
                            <span className="text-xs sm:text-[13px] font-semibold text-gray-800">Change Password</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MY ORDERS VIEW */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-[5px] p-6 sm:p-8 border border-gray-200/70 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">My Orders History</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      View all past and current deliveries, track shipments, and re-order with 1-click.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-pink-50 text-pink rounded-full border border-pink/20">
                    {orders.length} Total
                  </span>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200/80 rounded-2xl p-4 sm:p-6 bg-white hover:border-pink/40 transition-all space-y-4 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm sm:text-base text-gray-900">
                                Order #{order.order_number}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                  order.order_status?.toLowerCase() === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                    : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                                }`}
                              >
                                {order.order_status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Placed on {formatDate(order.created_at)}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-base font-extrabold text-gray-900">
                              ₹{Number(order.total_amount).toLocaleString('en-IN')}
                            </span>
                            <Link
                              href={`/orders/${order.id}`}
                              className="bg-black hover:bg-pink text-white text-xs font-bold px-4 py-1.5 rounded-full transition-all"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleBuyAgain(order)}
                              className="bg-pink hover:bg-[#d91668] text-white text-xs font-bold px-4 py-1.5 rounded-full transition-all shadow-pink"
                            >
                              Buy Again
                            </button>
                          </div>
                        </div>

                        {/* Items in order (Clickable for Product Information Modal) */}
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="space-y-2.5">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => setSelectedProductItem({ item, order })}
                                className="flex items-center justify-between text-xs sm:text-sm p-2 rounded-[5px] hover:bg-pink-50/50 transition-all cursor-pointer group border border-transparent hover:border-pink/20"
                                title="Click to view product details"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[5px] bg-gray-50 overflow-hidden relative shrink-0 border border-gray-200/80 group-hover:border-pink transition-colors flex items-center justify-center">
                                    {item.image_url ? (
                                      <Image
                                        src={item.image_url}
                                        alt={item.product_name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <Package className="w-5 h-5 text-gray-300" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-gray-900 group-hover:text-pink transition-colors truncate flex items-center gap-1.5">
                                      <span>{item.product_name}</span>
                                      <span className="text-[10px] text-pink font-bold bg-pink-50 px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        Details
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      {item.variant_name || 'Standard'} × {item.quantity}
                                    </div>
                                  </div>
                                </div>
                                <span className="font-bold text-gray-900">
                                  ₹{Number(item.line_total).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Courier & Tracking info */}
                        {(order.courier_name || order.tracking_number) && (
                          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 bg-gray-50/50 p-3 rounded-[5px]">
                            <div>
                              {order.courier_name && <span>Courier: <strong className="text-gray-800">{order.courier_name}</strong> | </span>}
                              {order.tracking_number && <span>Tracking: <strong className="text-gray-800">{order.tracking_number}</strong></span>}
                            </div>
                            <Link
                              href={`/orders/${order.id}`}
                              className="text-pink font-bold hover:underline"
                            >
                              Live Tracking →
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto text-pink">
                      <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">No Orders Placed Yet</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      You haven&apos;t placed any orders yet. Browse our exclusive drops and get your favorite hoodie delivered!
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink text-white rounded-[5px] text-xs font-bold shadow-pink hover:bg-[#d91668] transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" /> Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB: WISHLIST VIEW */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/70 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink fill-pink" />
                      <span>My Saved Wishlist</span>
                      <span className="text-xs font-bold text-pink bg-pink-50 px-2 py-0.5 rounded-full ml-1">
                        {wishlistItems.length}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Keep track of your favorite hoodies, tees and streetwear drops.</p>
                  </div>
                  <Link
                    href="/wishlist"
                    className="text-xs font-bold text-pink hover:text-[#d91668] transition-colors flex items-center gap-1 group"
                  >
                    <span>Full Wishlist Page</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>

                {wishlistItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                    {wishlistItems.map((product: any) => (
                      <TrendingProductCard
                        key={product.id}
                        product={product}
                        isWishlisted={true}
                        isLiked={true}
                        onToggleWishlist={handleToggleWishlistFromCard}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-14 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto text-pink shadow-xs">
                      <Heart className="w-8 h-8 text-pink stroke-[1.5]" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Your Wishlist is Empty</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      You haven&apos;t saved any streetwear drops yet. Explore our newest drops and tap the heart icon to save them here.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-pink text-white rounded-[5px] text-xs font-bold shadow-pink hover:bg-[#d91668] transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Explore Trending Drops</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ADDRESSES VIEW */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/70 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Saved Addresses</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Manage delivery locations for quick 1-click checkout. Saved in Supabase.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAddressForm({
                        id: undefined,
                        fullName: profile.full_name || '',
                        phone: profile.phone || '',
                        alternatePhone: '',
                        street: '',
                        addressLine2: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        isDefault: addresses.length === 0,
                      })
                      setIsAddressModalOpen(true)
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-pink text-white rounded-[5px] text-xs font-bold shadow-pink hover:bg-[#d91668] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Address
                  </button>
                </div>

                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`border rounded-2xl p-5 relative space-y-3 transition-all ${
                          addr.is_default ? 'border-pink/50 bg-pink-50/20' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-pink" />
                            {addr.address_line_1.length > 25 ? 'Delivery Address' : addr.address_line_1}
                          </span>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold bg-pink text-white px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-600 space-y-1">
                          <p className="font-semibold text-gray-900">{addr.full_name}</p>
                          <p>{addr.address_line_1} {addr.address_line_2 || ''}</p>
                          <p>{addr.city}, {addr.state} - {addr.postal_code}</p>
                          <p className="text-gray-400">Phone: {addr.phone}</p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          {!addr.is_default && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-pink font-bold hover:underline"
                            >
                              Set as Default
                            </button>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => {
                                setAddressForm({
                                  id: addr.id,
                                  fullName: addr.full_name,
                                  phone: addr.phone,
                                  alternatePhone: addr.alternate_phone || '',
                                  street: addr.address_line_1,
                                  addressLine2: addr.address_line_2 || '',
                                  city: addr.city,
                                  state: addr.state,
                                  zipCode: addr.postal_code,
                                  isDefault: addr.is_default,
                                })
                                setIsAddressModalOpen(true)
                              }}
                              className="p-1.5 text-gray-500 hover:text-pink rounded-lg hover:bg-gray-100"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {addresses.length > 1 && (
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1.5 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto text-pink">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">No Saved Addresses</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Add your shipping address for fast, 1-click checkout on your next purchases.
                    </p>
                    <button
                      onClick={() => {
                        setAddressForm({
                          fullName: profile.full_name || '',
                          phone: profile.phone || '',
                          alternatePhone: '',
                          street: '',
                          addressLine2: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          isDefault: true,
                        })
                        setIsAddressModalOpen(true)
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink text-white rounded-[5px] text-xs font-bold shadow-pink hover:bg-[#d91668] transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Delivery Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/70 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Security & Account Settings</h2>
                  <p className="text-xs text-gray-400 mt-1">Manage your credentials, password, and profile.</p>
                </div>

                <div className="max-w-md space-y-4">
                  <div className="p-4 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Email</span>
                    <p className="text-sm font-bold text-gray-900">{profile.email || 'user@example.com'}</p>
                    <p className="text-[11px] text-gray-400">Supabase authenticated account</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditProfileForm({ fullName: profile.full_name || '', phone: profile.phone || '' })
                      setIsEditProfileOpen(true)
                    }}
                    className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 text-left flex items-center justify-between transition-colors"
                  >
                    <span>Update Full Name & Phone</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 text-left flex items-center justify-between transition-colors"
                  >
                    <span>Change Account Password in Supabase</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MODALS & OVERLAYS (All connected to Supabase)
         ══════════════════════════════════════════════════ */}

      {/* 1. EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div
          onClick={() => setIsEditProfileOpen(false)}
          className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Profile Details</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-gray-400 hover:text-gray-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editProfileForm.fullName}
                    onChange={(e) => setEditProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="e.g"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={profile.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-[5px] text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-[5px] text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-pink hover:bg-[#d91668] text-white rounded-[5px] text-xs font-bold shadow-pink transition-all flex items-center justify-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save in Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div
          onClick={() => setIsChangePasswordOpen(false)}
          className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-gray-400 hover:text-gray-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-[5px] text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-pink hover:bg-[#d91668] text-white rounded-[5px] text-xs font-bold shadow-pink transition-all flex items-center justify-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD / EDIT ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div
          onClick={() => setIsAddressModalOpen(false)}
          className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {addressForm.id ? 'Edit Address' : 'Add New Shipping Address'}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="e.g"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                  Street Address / Flat / Building
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                  placeholder="e.g. Flat 402, Neon Tower, Main Road"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                    placeholder="State"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm((p) => ({ ...p, zipCode: e.target.value }))}
                    placeholder="202001"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-[5px] text-sm text-gray-900 focus:outline-none focus:border-pink"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="w-4 h-4 accent-pink rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700">Set as default shipping address</span>
              </label>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-[5px] text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-pink hover:bg-[#d91668] text-white rounded-[5px] text-xs font-bold shadow-pink transition-all flex items-center justify-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. PRODUCT INFORMATION MODAL (Compact, Responsive, Modern) */}
      {selectedProductItem && (
        <div
          onClick={() => setSelectedProductItem(null)}
          className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-[5px] p-5 sm:p-6 max-w-md w-full shadow-2xl border border-gray-100 relative space-y-4 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink bg-pink-50 px-2 py-0.5 rounded-md">
                    Order #{selectedProductItem.order.order_number}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      selectedProductItem.order.order_status?.toLowerCase() === 'delivered'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-cyan-50 text-[#218D98] border border-cyan-200'
                    }`}
                  >
                    {selectedProductItem.order.order_status || '—'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 pt-1">Product Information</h3>
              </div>

              <button
                onClick={() => setSelectedProductItem(null)}
                aria-label="Close product modal"
                className="text-gray-400 hover:text-gray-900 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Card Overview */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-[5px] bg-white overflow-hidden relative shrink-0 border border-gray-200 shadow-2xs flex items-center justify-center">
                {selectedProductItem.item.image_url ? (
                  <Image
                    src={selectedProductItem.item.image_url}
                    alt={selectedProductItem.item.product_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">
                  {selectedProductItem.item.product_name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                  <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 font-medium text-[11px]">
                    Size: <strong className="text-gray-900">{selectedProductItem.item.variant_name || 'Standard'}</strong>
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 font-medium text-[11px]">
                    Qty: <strong className="text-gray-900">{selectedProductItem.item.quantity}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Key Information Grid (Compact) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-[5px] bg-gray-50/70 border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Price per Unit</span>
                <span className="font-bold text-gray-900 text-sm">
                  ₹{Number(selectedProductItem.item.price_at_purchase).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-2.5 rounded-[5px] bg-gray-50/70 border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Item Line Total</span>
                <span className="font-bold text-pink text-sm">
                  ₹{Number(selectedProductItem.item.line_total).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-2.5 rounded-[5px] bg-gray-50/70 border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Order Date</span>
                <span className="font-medium text-gray-800 text-[11px] block truncate">
                  {formatDate(selectedProductItem.order.created_at)}
                </span>
              </div>

              <div className="p-2.5 rounded-[5px] bg-gray-50/70 border border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Payment Status</span>
                <span className="font-semibold text-emerald-600 text-[11px] capitalize block truncate">
                  {selectedProductItem.order.payment_status || '—'}
                  {selectedProductItem.order.payment_method ? ` (${selectedProductItem.order.payment_method})` : ''}
                </span>
              </div>
            </div>

            {/* Courier & Tracking Details if present */}
            {(selectedProductItem.order.courier_name || selectedProductItem.order.tracking_number) && (
              <div className="p-3 rounded-[5px] bg-cyan-50/60 border border-cyan-100 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-800 font-bold text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-[#36B8C5]" />
                  <span>Shipment & Courier Information</span>
                </div>
                <div className="flex items-center justify-between text-gray-700 text-[11px] pt-1">
                  <span>Courier: <strong className="text-gray-900">{selectedProductItem.order.courier_name || 'Bluedart / Delhivery'}</strong></span>
                  {selectedProductItem.order.tracking_number && (
                    <span>AWB: <strong className="text-gray-900 font-mono">{selectedProductItem.order.tracking_number}</strong></span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  addToCart({
                    id: selectedProductItem.item.product_id || selectedProductItem.item.id,
                    name: selectedProductItem.item.product_name,
                    price: Number(selectedProductItem.item.price_at_purchase) || 1999,
                    image_url: selectedProductItem.item.image_url || '',
                    variant_name: selectedProductItem.item.variant_name || 'Standard',
                  })
                  showToast(`Added ${selectedProductItem.item.product_name} to cart!`, 'success')
                  openCart()
                  setSelectedProductItem(null)
                }}
                className="w-full sm:flex-1 py-2.5 px-4 bg-pink text-white rounded-[5px] text-xs font-bold shadow-pink hover:bg-[#d91668] transition-all flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Buy Again
              </button>

              <Link
                href={`/orders/${selectedProductItem.order.id}`}
                onClick={() => setSelectedProductItem(null)}
                className="w-full sm:flex-1 py-2.5 px-4 border border-gray-200 hover:border-gray-400 text-gray-800 bg-white hover:bg-gray-50 rounded-[5px] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-gray-500" />
                Track Order
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
