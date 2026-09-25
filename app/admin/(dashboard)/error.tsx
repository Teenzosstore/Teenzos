'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin dashboard render error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-cream-deep px-4 py-16 text-ink">
      <div className="mx-auto max-w-xl rounded-xl border border-cream-line bg-panel p-6 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Admin dashboard
        </p>
        <h1 className="mt-3 text-2xl font-bold">This page could not load</h1>
        <p className="mt-2 text-sm text-ink/70">
          The admin route exists, but a server-side dependency failed while loading it.
          Check the hosting environment variables and database access, then try again.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:bg-gold-light"
          >
            Reload admin
          </button>
          <Link
            href="/admin/login"
            className="rounded-lg border border-cream-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cream/10"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  )
}
