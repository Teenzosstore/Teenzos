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
  Image as ImageIcon,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
  User,
  Truck,
  Tag,
  X,
  Ruler,
  Mail,
  Video,
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
  { label: 'Subscribers', href: '/admin/subscribers', icon: Mail },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
  { label: 'Hero Section', href: '/admin/hero-slides', icon: ImageIcon },
  { label: 'Video Section', href: '/admin/video-section', icon: Video },
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
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${
          collapsed ? 'md:w-[72px]' : 'md:w-64'
        } ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200/80 flex flex-col shrink-0 transition-all duration-300 ease-in-out md:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-2.5 justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 min-w-0 group"
            onClick={() => setMobileOpen(false)}
          >
            {/* Colorful Person Icon */}
            <div className="w-9 h-9 rounded-[5px] bg-gradient-to-tr from-[#F72585] via-[#FF2E93] to-[#36B8C5] flex items-center justify-center shrink-0 shadow-md shadow-[#F72585]/25 group-hover:scale-105 transition-transform duration-200">
              <User className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1 leading-none">
                <span className="font-display font-[500] text-[18px] tracking-[0.05em] text-[#0B0D0E] group-hover:text-[#F72585] transition-colors">
                  TeenZos<span className="text-[#F72585]">.</span>
                </span>
                <span className="block text-[10px] tracking-[0.2em] uppercase text-[#6B7073] mt-1 font-semibold">
                  ADMIN PANEL
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-[#F72585] hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto custom-scrollbar">
          {mounted &&
            navItems.map((item) => {
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-[5px] text-sm font-medium transition-all duration-150 group font-sans ${
                    isActive
                      ? 'bg-[#FFE1ED] text-[#F72585] font-semibold shadow-xs'
                      : 'text-[#0B0D0E]/70 hover:text-[#0B0D0E] hover:bg-gray-100/70'
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#F72585]'
                        : 'text-gray-400 group-hover:text-[#F72585]'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="p-3 border-t border-gray-100 hidden md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-[#0B0D0E] hover:bg-gray-100 transition-all duration-200 text-sm font-sans cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="font-medium text-xs">Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
