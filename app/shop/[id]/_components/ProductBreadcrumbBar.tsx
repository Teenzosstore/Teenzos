'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Link as LinkIcon } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

type ProductBreadcrumbBarProps = {
  categoryName: string
  categoryId: string
  productName: string
}

export default function ProductBreadcrumbBar({
  categoryName,
  categoryId,
  productName,
}: ProductBreadcrumbBarProps) {
  const { showToast } = useToast()

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'instagram' | 'copy') => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const text = `Check out ${productName} on TeenZos Streetwear!`

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/`)
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(url)
      showToast('Link copied! Share it on your Instagram story or DM.', 'success')
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      showToast('Product link copied to clipboard!', 'success')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 text-xs sm:text-sm">
      {/* Breadcrumb Links */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-medium text-gray-500">
        <Link href="/" className="hover:text-[#FF007A] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link
          href={`/shop?category=${categoryId || 'all'}`}
          className="text-[#FF007A] hover:underline capitalize font-semibold"
        >
          {categoryName || 'Hoodies'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[#FF007A] font-semibold truncate max-w-[180px] sm:max-w-[280px]">
          {productName}
        </span>
      </nav>

      {/* Social Share Icons */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 ml-auto">
        <span className="text-gray-500 mr-1">Share:</span>

        {/* WhatsApp Icon */}
        <button
          type="button"
          onClick={() => handleShare('whatsapp')}
          aria-label="Share on WhatsApp"
          className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:border-[#25D366] hover:text-[#25D366] text-gray-700 flex items-center justify-center transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
          </svg>
        </button>

        {/* Facebook Icon */}
        <button
          type="button"
          onClick={() => handleShare('facebook')}
          aria-label="Share on Facebook"
          className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:border-[#1877F2] hover:text-[#1877F2] text-gray-700 flex items-center justify-center transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>

        {/* Instagram Icon */}
        <button
          type="button"
          onClick={() => handleShare('instagram')}
          aria-label="Share on Instagram"
          className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:border-[#E4405F] hover:text-[#E4405F] text-gray-700 flex items-center justify-center transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </button>

        {/* Copy Link Icon */}
        <button
          type="button"
          onClick={() => handleShare('copy')}
          aria-label="Copy link"
          title="Copy link"
          className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:border-[#FF007A] hover:text-[#FF007A] text-gray-700 flex items-center justify-center transition-colors shadow-2xs"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
