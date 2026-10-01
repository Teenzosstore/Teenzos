'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { resetPasswordWithToken } from '@/actions/auth'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'

export default function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsBusy(true)
    try {
      const res = await resetPasswordWithToken(token, newPassword)
      if (res?.error) {
        setError(res.error)
        setIsBusy(false)
        return
      }

      setSuccess(true)
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.assign('/login?reset=success')
        }, 1500)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please try again.')
      setIsBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="relative w-full rounded-[28px] sm:rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-gray-100/90 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#0B0D0E] mb-1.5">Invalid Reset Link</h1>
        <p className="text-sm text-gray-500 mb-5">
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-[#F72585] text-white text-sm font-bold hover:bg-[#d91668] transition-colors"
        >
          Back to Login
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="relative w-full rounded-[28px] sm:rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-gray-100/90 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#0B0D0E] mb-1.5">Password Reset!</h1>
        <p className="text-sm text-gray-500">Redirecting you to the login page...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-[28px] sm:rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-gray-100/90 transition-all duration-300">
      <div className="mb-5 sm:mb-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F72585]/10 text-[#F72585] flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0D0E] tracking-tight font-sans">
          Set New Password
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed font-sans">
          Choose a new password for your TeenZos account.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new_password" className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5">
            New Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
            <input
              id="new_password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full h-11 sm:h-12 pl-11 pr-11 rounded-xl border border-gray-200 bg-white text-sm text-[#0B0D0E] placeholder:text-gray-400 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5">
            Confirm New Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
            <input
              id="confirm_password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-[#0B0D0E] placeholder:text-gray-400 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="w-full h-11 sm:h-12 rounded-xl bg-[#F72585] hover:bg-[#d91668] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resetting...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>

        <p className="text-center text-xs sm:text-sm text-gray-500 pt-1">
          <Link href="/login" className="font-semibold text-[#F72585] hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  )
}
