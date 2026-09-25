'use client'

import { useState, useActionState } from 'react'
import { adminLogin, type AuthResult } from '@/actions/auth'
import { Eye, EyeOff, Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    adminLogin,
    {}
  )
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080909] relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#141614] via-[#080909] to-[#080909]" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-panel rounded-2xl shadow-card border border-cream-line p-8">
          {/* Admin branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-gold to-gold-light rounded-xl mb-4 shadow-lg shadow-gold/20">
              <Shield className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
            <p className="text-ink/60 mt-1 text-sm">
              Teenzosstore — Management Portal
            </p>
          </div>

          {/* Error message */}
          {state.error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {state.error}
            </div>
          )}

          {/* Login Form */}
          <form
            action={formAction}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Admin email"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream-deep text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-ink/80 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream-deep text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all duration-200 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/75 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-gold to-gold-light text-black font-semibold rounded-xl shadow-md shadow-gold/20 hover:shadow-lg hover:shadow-gold/30 hover:from-gold-light hover:to-gold-light focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {pending ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4.5 h-4.5" />
                  Access Dashboard
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
