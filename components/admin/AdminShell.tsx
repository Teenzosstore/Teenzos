import AdminSidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/Header'
import { AdminSidebarProvider } from '@/context/AdminSidebarContext'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminSidebarProvider>
      <div className="admin-shell flex h-screen overflow-hidden bg-cream-deep">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AdminSidebarProvider>
  )
}
