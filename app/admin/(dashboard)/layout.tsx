import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (e) {
    console.error('requireAdmin error:', e)
    admin = { ok: false as const, error: 'Auth failed' }
  }
  
  if (admin.ok === false) {
    redirect('/admin/login')
  }

  return <AdminShell>{children}</AdminShell>
}
