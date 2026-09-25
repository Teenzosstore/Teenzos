'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Users,
  ShoppingCart,
  MessageSquare,
  Image,
  Images,
  ImagePlus,
  BookOpen,
  Info,
  Megaphone,
  Settings,
  Shirt,
  ChevronLeft,
  ChevronRight,
  Star,
  User,
  Truck,
  Tag,
  X,
  Ruler,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAdminSidebar } from '@/context/AdminSidebarContext'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Size Chart', href: '/admin/size-chart', icon: Ruler },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
  { label: 'Hero Section', href: '/admin/hero-slides', icon: Image },
  { label: 'Home Banner', href: '/admin/home-banner', icon: Images },
  { label: 'Lookbook', href: '/admin/lookbook', icon: BookOpen },
  { label: 'About Section', href: '/admin/about-section', icon: Info },
  { label: 'Oversized Section', href: '/admin/oversized-section', icon: Shirt },
  { label: 'Media Library', href: '/admin/media', icon: ImagePlus },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Global FAQs', href: '/admin/settings/faqs', icon: Settings },
  { label: 'Shipping Settings', href: '/admin/settings/shipping', icon: Truck },
  { label: 'Manage Coupons', href: '/admin/settings/coupons', icon: Tag },
  { label: 'Manage Profile', href: '/admin/settings/profile', icon: User },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { mobileOpen, setMobileOpen } = useAdminSidebar()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${
          collapsed ? 'md:w-[72px]' : 'md:w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:static inset-y-0 left-0 z-50 w-64 bg-panel border-r border-cream-line flex flex-col shrink-0 transition-all duration-300 ease-in-out md:translate-x-0`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-4 border-b border-cream-line gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-gold/20">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-ink font-semibold text-sm leading-tight truncate">
                Teenzosstore
              </p>
              <p className="text-ink/50 text-xs truncate">Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-ink/50 hover:text-gold-light hover:bg-cream-deep/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {mounted && navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gold/15 text-gold-light font-semibold'
                    : 'text-ink/75 hover:text-gold-light hover:bg-cream-deep/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive
                      ? 'text-gold-light'
                      : 'text-ink/40 group-hover:text-gold'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="p-3 border-t border-cream-line hidden md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-ink/50 hover:text-gold-light hover:bg-cream-deep/60 transition-all duration-200 text-sm"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
