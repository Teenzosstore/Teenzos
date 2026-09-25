import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { logout } from '@/actions/auth'
import MobileMenuButton from '@/components/admin/MobileMenuButton'

export default async function AdminHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="h-16 bg-[#121619] border-b border-white/10 flex items-center justify-between px-3 sm:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <MobileMenuButton />
        <h2 className="text-base sm:text-lg font-semibold text-white truncate">
          Admin Dashboard
        </h2>
        <Link
          href="/"
          className="hidden sm:flex text-xs font-semibold text-cyan hover:text-cyan-light border border-cyan/30 hover:border-cyan/60 bg-cyan/10 hover:bg-cyan/20 px-3.5 py-1 rounded-full transition-all items-center gap-1 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Site
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Admin info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-white/80" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white/90 leading-tight">
              {user?.email || 'Admin'}
            </p>
            <p className="text-xs text-white/40">Administrator</p>
          </div>
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-pink hover:bg-white/5 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  )
}
