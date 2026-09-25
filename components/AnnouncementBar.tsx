'use client'

import { useEffect, useState } from 'react'
import { getAnnouncement } from '@/actions/admin/announcements'

type Announcement = {
  message: string
  is_active: boolean
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    getAnnouncement()
      .then(setAnnouncement)
      .catch((error) => {
        console.error('Failed to load announcement:', error)
        setAnnouncement(null)
      })
  }, [])

  if (!announcement?.is_active || !announcement.message.trim()) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[100000] bg-[#0C0E0D] border-b border-[#D4A82C] h-8 md:h-9 flex items-center justify-center px-4">
      <p className="text-[9px] md:text-[10px] lg:text-[11px] font-bold tracking-[0.22em] uppercase text-white flex items-center gap-2 whitespace-nowrap">
        <svg className="w-4 h-4 shrink-0 text-[#D4A82C]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2L4.5 13.5h5L10 22l8.5-11.5h-5L13 2z" />
        </svg>
        {announcement.message}
      </p>
    </div>
  )
}
