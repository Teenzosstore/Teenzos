'use client'

import { Menu } from 'lucide-react'
import { useAdminSidebar } from '@/context/AdminSidebarContext'

export default function MobileMenuButton() {
  const { setMobileOpen } = useAdminSidebar()

  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="md:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:text-[#F72585] hover:bg-[#FFE1ED]/50 transition-colors focus:outline-none"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
