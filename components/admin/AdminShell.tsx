import AdminSidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/Header'
import { AdminSidebarProvider } from '@/context/AdminSidebarContext'
import { ToastProvider } from '@/context/ToastContext'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminSidebarProvider>
        <div className="admin-shell flex h-screen overflow-hidden bg-[#F8F9FA] text-[#0B0D0E] font-sans selection:bg-[#F72585] selection:text-white">
          <AdminSidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </AdminSidebarProvider>
    </ToastProvider>
  )
}
