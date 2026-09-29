"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { adminLogin, type AuthResult } from "@/actions/auth";
import {
  Eye,
  EyeOff,
  Shield,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    adminLogin,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] relative overflow-hidden px-4 py-8 sm:py-12 selection:bg-[#F72585] selection:text-white">
      {/* Decorative ambient lighting - modern soft brand glow (NOT black) */}
      <div className="absolute top-[-10%] -left-[10%] w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] bg-[#F72585]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] -right-[10%] w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] bg-[#36B8C5]/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#F72585]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle modern dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.07)] border border-gray-100 p-6 sm:p-9 transition-all">
          {/* Logo & Header */}
          <div className="mb-6 sm:mb-7">
            {/* Top row: Logo + Admin Badge in 1 Row */}
            <div className="flex items-center justify-between gap-2.5 pb-4 mb-5 border-b border-gray-100">
              <Link
                href="/"
                className="inline-flex items-center gap-2 group focus:outline-none"
                title="Return to TeenZos Store"
              >
                <Image
                  src="/TeenZos_Logo.png"
                  alt="TeenZos Logo"
                  width={130}
                  height={45}
                  className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
                  priority
                  unoptimized
                />
                <div className="flex flex-col justify-start text-left leading-none">
                  <span className="font-display font-[500] text-lg sm:text-xl tracking-[0.05em] text-[#0B0D0E] group-hover:text-[#F72585] transition-colors">
                    TeenZos<span className="text-[#F72585]">.</span>
                  </span>
                  <span className="text-[7px] sm:text-[8px] tracking-[0.2em] uppercase text-[#6B7073] mt-0.5 font-semibold">
                    WEAR YOUR VIBE
                  </span>
                </div>
              </Link>

              {/* Admin Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFE1ED] border border-[#F72585]/20 text-[#F72585] text-[11px] sm:text-xs font-semibold tracking-wide shrink-0">
                <Shield className="w-3.5 h-3.5 text-[#F72585]" />
                <span>Admin Console</span>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B0D0E] font-sans">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7073] mt-1 font-sans">
                Enter your credentials to access the management portal
              </p>
            </div>
          </div>

          {/* Error message */}
          {state?.error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <p className="font-semibold">Authentication Error</p>
                <p className="text-rose-600/90 text-xs mt-0.5">{state.error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form action={formAction} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs sm:text-sm font-semibold text-[#0B0D0E] mb-1.5 font-sans"
              >
                Admin Email
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@teenzos.com"
                  className="w-full outline-none! pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-[5px] border border-gray-200 bg-gray-50/70 text-[#0B0D0E] placeholder:text-gray-400  focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] focus:bg-white transition-all duration-200 font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs sm:text-sm font-semibold text-[#0B0D0E] font-sans"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F72585] transition-colors pointer-events-none">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  className="w-full outline-none! pl-11 pr-11 py-2.5 sm:py-3 text-sm sm:text-base rounded-[5px] border border-gray-200 bg-gray-50/70 text-[#0B0D0E] placeholder:text-gray-400 focus:ring-2 focus:ring-[#F72585]/20 focus:border-[#F72585] focus:bg-white transition-all duration-200 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0B0D0E] transition-colors p-1 rounded-lg focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#F72585] to-[#FF4D9A] hover:from-[#D91668] hover:to-[#F72585] text-white font-semibold text-sm sm:text-base rounded-xl shadow-md shadow-[#F72585]/25 hover:shadow-lg hover:shadow-[#F72585]/35 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#F72585]/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              {pending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Access Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-white/80" />
                </>
              )}
            </button>
          </form>

          {/* Return to store link */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#6B7073] hover:text-[#F72585] transition-colors font-sans"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to TeenZos Store</span>
            </Link>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center text-xs text-[#6B7073] flex items-center justify-center gap-1.5 font-sans">
          <Shield className="w-3.5 h-3.5 text-gray-400" />
          <span>Restricted Portal &bull; Authorized Personnel Only</span>
        </div>
      </div>
    </div>
  );
}
