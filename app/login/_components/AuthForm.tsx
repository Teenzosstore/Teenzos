'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  loginWithCredentials,
  registerWithCredentials,
  sendPasswordReset,
  sendEmailOtp,
  verifyEmailOtp,
} from '@/actions/auth'
import {
  User,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'

type TabMode = 'LOGIN' | 'REGISTER'
type FormView = 'DEFAULT' | 'FORGOT_PASSWORD' | 'OTP_MODE'

function getSafeRedirectPath(redirectTo: string | undefined): string {
  if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return '/'
  }
  return redirectTo
}

export default function AuthForm({
  redirectTo,
  initialError,
  initialSuccess,
}: {
  redirectTo?: string
  initialError?: string
  initialSuccess?: string
}) {
  // Tab state
  const [tab, setTab] = useState<TabMode>('LOGIN')
  const [view, setView] = useState<FormView>('DEFAULT')

  // Password Login & Registration fields
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [agreeTerms, setAgreeTerms] = useState(true)

  // Forgot Password / OTP states
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpIdentifier, setOtpIdentifier] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpModeType, setOtpModeType] = useState<'LOGIN' | 'REGISTER'>('LOGIN')
  const [resendTimer, setResendTimer] = useState(0)
  // Feedback states
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState(initialError || '')
  const [success, setSuccess] = useState(initialSuccess || '')

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendTimer])

  // Reset errors when switching tab or view
  const switchTab = (nextTab: TabMode) => {
    setTab(nextTab)
    setView('DEFAULT')
    setOtpSent(false)
    setOtpCode('')
    setOtpModeType(nextTab)
    setError('')
    setSuccess('')
  }

  // Handle standard Login (Email or Username + Password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!identifier.trim()) {
      setError('Please enter your email or username.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setIsBusy(true)
    try {
      const res = await loginWithCredentials(identifier.trim(), password)
      if (res?.error) {
        setError(res.error)
        setIsBusy(false)
        return
      }

      setSuccess('Logged in successfully! Redirecting...')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('rawflex-login-status-change'))
        window.location.assign(getSafeRedirectPath(redirectTo))
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.')
      setIsBusy(false)
    }
  }

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!identifier.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      return
    }

    setIsBusy(true)
    try {
      const res = await registerWithCredentials(
        fullName.trim(),
        identifier.trim(),
        password,
        registerPhone.trim() || undefined
      )

      if (res?.error) {
        setError(res.error)
        setIsBusy(false)
        return
      }

      setSuccess('Account created successfully! Redirecting...')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('rawflex-login-status-change'))
        window.location.assign(getSafeRedirectPath(redirectTo))
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
      setIsBusy(false)
    }
  }

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setIsBusy(true)
    try {
      const res = await sendPasswordReset(forgotEmail.trim())
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess('Password reset link sent to your email. Check your inbox!')
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to send reset link.')
    } finally {
      setIsBusy(false)
    }
  }

  // Handle Registration with Email OTP (Saves OTP in Supabase email_otps table & sends Brevo email)
  const handleRegisterWithOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!identifier.trim() || !identifier.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      return
    }

    setIsBusy(true)
    try {
      const emailVal = identifier.trim().toLowerCase()
      const res = await sendEmailOtp(emailVal, 'REGISTER', fullName.trim())
      if (res?.error) {
        setError(res.error)
        setIsBusy(false)
        return
      }

      setOtpModeType('REGISTER')
      setOtpIdentifier(emailVal)
      setOtpSent(true)
      setResendTimer(60)
      setView('OTP_MODE')
      setSuccess(`Verification code sent to ${emailVal}! Enter the 6-digit code below.`)
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP verification code.')
    } finally {
      setIsBusy(false)
    }
  }

  // Handle OTP Send (for users who prefer OTP)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const val = otpIdentifier.trim()
    if (!val) {
      setError('Please enter your email address.')
      return
    }

    if (!val.includes('@')) {
      setError('Please enter a valid email address to receive OTP code.')
      return
    }

    setIsBusy(true)
    try {
      const emailVal = val.toLowerCase()
      const res = await sendEmailOtp(emailVal, otpModeType, fullName.trim() || undefined)
      if (res?.error) {
        setError(res.error)
      } else {
        setOtpSent(true)
        setResendTimer(60)
        setSuccess(`Verification code sent to ${val}`)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP code.')
    } finally {
      setIsBusy(false)
    }
  }

  // Handle OTP Verification (Validates against Supabase email_otps table)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code.')
      return
    }

    setIsBusy(true)
    try {
      const val = otpIdentifier.trim().toLowerCase()
      const res = await verifyEmailOtp(
        val,
        otpCode,
        redirectTo,
        fullName.trim() || undefined,
        registerPhone.trim() || undefined,
        password || undefined
      )
      if (res?.error) {
        setError(res.error)
        setIsBusy(false)
        return
      }
      setSuccess('Account verified successfully! Redirecting...')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('rawflex-login-status-change'))
        window.location.assign(getSafeRedirectPath(redirectTo))
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code.')
      setIsBusy(false)
    }
  }

  return (
    <div className="relative w-full rounded-[28px] sm:rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-gray-100/90 transition-all duration-300">

      {/* Top Segmented Tab Switch (Login / Register) */}
      <div className="bg-[#F1F3F5] p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 mb-5 sm:mb-6">
        <button
          type="button"
          onClick={() => switchTab('LOGIN')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            tab === 'LOGIN' && view === 'DEFAULT'
              ? 'bg-[#F72585] text-white shadow-md shadow-[#F72585]/30'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Login</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('REGISTER')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            tab === 'REGISTER' && view === 'DEFAULT'
              ? 'bg-[#F72585] text-white shadow-md shadow-[#F72585]/30'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Register</span>
        </button>
      </div>

      {/* Heading & Subtitle */}
      <div className="mb-5 sm:mb-6">
        {view === 'FORGOT_PASSWORD' ? (
          <>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0D0E] tracking-tight font-sans text-center">
              Reset Password
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed font-sans text-center">
              Enter your email address to receive password reset instructions.
            </p>
          </>
        ) : view === 'OTP_MODE' ? (
          <>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0D0E] tracking-tight font-sans text-center">
              {otpModeType === 'REGISTER' ? 'Verify Your Email' : 'OTP Verification'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed font-sans text-center">
              {otpModeType === 'REGISTER'
                ? 'Enter the 6-digit verification code sent to your email.'
                : 'Sign in securely with a one-time passcode sent to your email.'}
            </p>
          </>
        ) : tab === 'LOGIN' ? (
          <>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0D0E] tracking-tight font-sans text-center">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed font-sans text-center">
              Log in to your TeenZos account and continue your streetwear journey.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0B0D0E] tracking-tight font-sans text-center">
              Create Account
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed font-sans text-center">
              Join the TeenZos squad and get early access to exclusive drops.
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-700 animate-slide-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="leading-snug">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800 animate-slide-in">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="leading-snug">{success}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. LOGIN FORM (Exact same design as user's screenshot)    */}
      {/* ======================================================== */}
      {view === 'DEFAULT' && tab === 'LOGIN' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login_identifier"
              className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5"
            >
              Email or Username
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
              <input
                id="login_identifier"
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-[#0B0D0E] placeholder:text-gray-400 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login_password"
              className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5"
            >
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
              <input
                id="login_password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#F72585] accent-[#F72585] focus:ring-[#F72585] cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                setView('FORGOT_PASSWORD')
                setForgotEmail(identifier.includes('@') ? identifier : '')
                setError('')
                setSuccess('')
              }}
              className="text-xs sm:text-sm font-semibold text-[#F72585] hover:text-[#D91668] transition-colors cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Primary Login Button */}
          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-11 sm:h-12 rounded-xl bg-[#F72585] hover:bg-[#D91668] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-lg shadow-[#F72585]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2.5 text-gray-400 font-medium">Or</span>
            </div>
          </div>

          {/* Prominent OTP Login Button */}
          <button
            type="button"
            onClick={() => {
              setOtpModeType('LOGIN')
              setOtpIdentifier(identifier)
              setOtpSent(false)
              setOtpCode('')
              setView('OTP_MODE')
              setError('')
              setSuccess('')
            }}
            className="w-full h-11 sm:h-12 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-[0.99] text-gray-800 font-semibold text-xs sm:text-sm border border-gray-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#F72585]" />
            <span>Sign in with Email OTP</span>
          </button>

          {/* Bottom Prompt */}
          <div className="text-center mt-5 sm:mt-6 text-xs sm:text-sm text-gray-500 font-medium">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => switchTab('REGISTER')}
              className="font-semibold text-[#F72585] hover:text-[#D91668] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. REGISTER FORM                                         */}
      {/* ======================================================== */}
      {view === 'DEFAULT' && tab === 'REGISTER' && (
        <form onSubmit={handleRegisterWithOtp} className="space-y-4">
          <div>
            <label
              htmlFor="reg_name"
              className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5"
            >
              Full Name
            </label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
              <input
                id="reg_name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-[#0B0D0E] placeholder:text-gray-400 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg_email"
              className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5"
            >
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
              <input
                id="reg_email"
                type="email"
                required
                autoComplete="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email address"
                className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-[#0B0D0E] placeholder:text-gray-400 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg_phone"
              className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5"
            >
              Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative group">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
              <input
                id="reg_phone"
                type="tel"
                autoComplete="tel"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-[#0B0D0E] placeholder:text-gray-400 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg_password"
              className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5"
            >
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
              <input
                id="reg_password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min. 6 characters)"
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

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#F72585] accent-[#F72585] focus:ring-[#F72585] cursor-pointer"
              />
              <span className="text-xs text-gray-500 leading-snug">
                I agree to the{' '}
                <a href="/policies/terms" className="text-[#F72585] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/policies/privacy" className="text-[#F72585] hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-11 sm:h-12 rounded-xl bg-[#F72585] hover:bg-[#D91668] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-lg shadow-[#F72585]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Create Account (Verify Email OTP)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleRegister}
              disabled={isBusy}
              className="text-[11px] sm:text-xs text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-4 cursor-pointer"
            >
              Or direct register without email OTP
            </button>
          </div>

          <div className="text-center mt-5 sm:mt-6 text-xs sm:text-sm text-gray-500 font-medium">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchTab('LOGIN')}
              className="font-semibold text-[#F72585] hover:text-[#D91668] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 3. FORGOT PASSWORD VIEW                                  */}
      {/* ======================================================== */}
      {view === 'FORGOT_PASSWORD' && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label
              htmlFor="forgot_email"
              className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5"
            >
              Registered Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
              <input
                id="forgot_email"
                type="email"
                required
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-[#0B0D0E] placeholder:text-gray-400 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-11 sm:h-12 rounded-xl bg-[#F72585] hover:bg-[#D91668] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-lg shadow-[#F72585]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-3">
            <button
              type="button"
              onClick={() => {
                setView('DEFAULT')
                setError('')
                setSuccess('')
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#F72585] hover:text-[#D91668] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 4. OTP LOGIN / VERIFICATION VIEW                         */}
      {/* ======================================================== */}
      {view === 'OTP_MODE' && (
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="otp_id"
                  className="block text-xs sm:text-sm font-bold text-[#0B0D0E] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
                  <input
                    id="otp_id"
                    type="email"
                    required
                    value={otpIdentifier}
                    onChange={(e) => setOtpIdentifier(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-[#0B0D0E] placeholder:text-gray-400 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full h-11 sm:h-12 rounded-xl bg-[#F72585] hover:bg-[#D91668] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-lg shadow-[#F72585]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setView('DEFAULT')
                    setOtpSent(false)
                    setError('')
                    setSuccess('')
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#F72585] hover:text-[#D91668] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{otpModeType === 'REGISTER' ? 'Back to Registration Form' : 'Back to Password Login'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="otp_code_input"
                    className="block text-xs sm:text-sm font-bold text-[#0B0D0E]"
                  >
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false)
                      setOtpCode('')
                      setError('')
                      setSuccess('')
                    }}
                    className="text-xs font-semibold text-[#F72585] hover:underline cursor-pointer"
                  >
                    Change recipient
                  </button>
                </div>
                <div className="relative group">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none" />
                  <input
                    id="otp_code_input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-center text-lg tracking-[0.3em] font-bold text-[#0B0D0E] placeholder:text-gray-300 focus:outline-none focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/15 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full h-11 sm:h-12 rounded-xl bg-[#F72585] hover:bg-[#D91668] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-lg shadow-[#F72585]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>{otpModeType === 'REGISTER' ? 'Verify & Activate Account' : 'Verify & Login'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isBusy || resendTimer > 0}
                  className="text-xs font-semibold text-gray-500 hover:text-[#F72585] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
