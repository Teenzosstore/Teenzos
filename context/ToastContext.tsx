'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  type: ToastType
}

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let nextId = 1

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.5} />,
  error: <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" strokeWidth={2.5} />,
  info: <Info className="w-3.5 h-3.5 text-[#36B8C5] shrink-0" strokeWidth={2.5} />,
}

const ICON_BADGE: Record<ToastType, string> = {
  success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  error: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  info: 'bg-[#36B8C5]/20 text-[#36B8C5] border border-[#36B8C5]/30',
}

const TOAST_BORDER: Record<ToastType, string> = {
  success: 'border-emerald-500/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.25)]',
  error: 'border-rose-500/30 shadow-[0_8px_24px_-4px_rgba(244,63,94,0.25)]',
  info: 'border-[#36B8C5]/30 shadow-[0_8px_24px_-4px_rgba(54,184,197,0.25)]',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++
    // Keep max 3 toasts visible at once to avoid screen clutter
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => dismissToast(id), 3200)
  }, [dismissToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Notification Stack - Highest Z-Index, Top Centered on Mobile, Top-Right on Desktop */}
      <div
        style={{ zIndex: 9999999 }}
        className="fixed top-3.5 sm:top-5 inset-x-0 sm:inset-x-auto sm:right-5 flex flex-col items-center sm:items-end gap-2 pointer-events-none px-3 sm:px-0 transition-all duration-300"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto group relative flex items-center gap-2 sm:gap-2.5 bg-[#0B0D0E]/95 text-white backdrop-blur-md rounded-full border ${TOAST_BORDER[toast.type]} pl-2.5 pr-3 py-1.5 sm:py-2 max-w-[calc(100vw-24px)] sm:max-w-md shadow-2xl transition-all duration-200 select-none animate-toast-enter`}
            style={{
              animation: 'toastSlideDown 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Status Icon Badge */}
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ICON_BADGE[toast.type]}`}>
              {ICONS[toast.type]}
            </div>

            {/* Message Text */}
            <p className="text-xs sm:text-[13px] font-medium text-white/95 leading-snug tracking-tight pr-1 break-words">
              {toast.message}
            </p>

            {/* Quick Dismiss Button */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0 -mr-0.5 ml-auto"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
