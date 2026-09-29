import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut, User, ExternalLink } from 'lucide-react'
import { logout } from '@/actions/auth'
import MobileMenuButton from '@/components/admin/MobileMenuButton'

export default async function AdminHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-3 sm:px-6 shrink-0 gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <MobileMenuButton />
        <h2 className="text-base sm:text-lg font-bold text-[#0B0D0E] truncate font-sans">
          Dashboard
        </h2>
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex text-xs font-semibold text-[#F72585] hover:text-[#D91668] border border-[#F72585]/30 hover:border-[#F72585]/60 bg-[#FFE1ED]/70 hover:bg-[#FFE1ED] px-3 py-1 rounded-full transition-all items-center gap-1.5 shadow-xs font-sans"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Store
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Admin profile badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FFE1ED] border border-[#F72585]/30 flex items-center justify-center shrink-0 text-[#F72585]">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-[#0B0D0E] leading-tight font-sans truncate max-w-[180px]">
              {user?.email || 'Admin'}
            </p>
            <p className="text-[11px] text-[#6B7073] font-sans font-medium">Administrator</p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer font-sans"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  )
}
