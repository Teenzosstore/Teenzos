'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  AnnouncementsConfig,
  DEFAULT_TICKER_ITEMS,
  AnnouncementTickerItem,
} from '@/lib/announcements'
import { getAnnouncementsConfig } from '@/actions/admin/announcements'
import {
  Truck,
  Zap,
  Flame,
  Sparkles,
  Tag,
  ShieldCheck,
  Megaphone,
  Star,
} from 'lucide-react'

const ICON_MAP = {
  truck: Truck,
  zap: Zap,
  flame: Flame,
  sparkles: Sparkles,
  tag: Tag,
  shield: ShieldCheck,
  megaphone: Megaphone,
  star: Star,
} as const

type IconKey = keyof typeof ICON_MAP

const THEME_STYLES: Record<
  string,
  { badgeBg: string; badgeText: string; iconColor: string }
> = {
  cyan: {
    badgeBg: 'bg-[#36B8C5]',
    badgeText: 'text-[#0B0D0E]',
    iconColor: 'text-[#36B8C5]',
  },
  pink: {
    badgeBg: 'bg-[#F72585]',
    badgeText: 'text-white',
    iconColor: 'text-[#F72585]',
  },
  orange: {
    badgeBg: 'bg-[#F47B20]',
    badgeText: 'text-[#0B0D0E]',
    iconColor: 'text-[#F47B20]',
  },
  'soft-pink': {
    badgeBg: 'bg-[#FFE1ED]',
    badgeText: 'text-[#F72585]',
    iconColor: 'text-[#36B8C5]',
  },
  white: {
    badgeBg: 'bg-white',
    badgeText: 'text-[#0B0D0E]',
    iconColor: 'text-[#F72585]',
  },
  'cyan-subtle': {
    badgeBg: 'bg-[#36B8C5]/20',
    badgeText: 'text-[#36B8C5]',
    iconColor: 'text-[#36B8C5]',
  },
}

export default function AnnouncementBar() {
  const [config, setConfig] = useState<AnnouncementsConfig>({
    is_enabled: true,
    items: DEFAULT_TICKER_ITEMS,
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAnnouncementsConfig()
      .then((cfg) => {
        if (cfg) setConfig(cfg)
        setLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to load announcements:', error)
        setLoaded(true)
      })
  }, [])

  const activeItems: AnnouncementTickerItem[] = useMemo(() => {
    if (!config.is_enabled) return []
    const general = (config.items && config.items.length > 0 ? config.items : DEFAULT_TICKER_ITEMS)
      .filter((item) => item.id !== 'code' && item.is_active && item.text?.trim())

    const list: AnnouncementTickerItem[] = [...general]

    // If coupon spotlight is enabled, insert it into marquee ticker
    const couponItem = config.coupon_item
    if (couponItem && couponItem.is_enabled !== false && couponItem.text?.trim()) {
      const couponTickerItem: AnnouncementTickerItem = {
        id: 'coupon-spotlight',
        badge: couponItem.badge || 'CODE: TEENZOS10',
        badge_theme: couponItem.badge_theme || 'white',
        icon: (couponItem.icon as any) || 'tag',
        text: couponItem.text,
        is_active: true,
      }
      const insertIdx = Math.min(2, list.length)
      list.splice(insertIdx, 0, couponTickerItem)
    }

    return list
  }, [config])

  useEffect(() => {
    if (!loaded) return
    const isVisible = Boolean(config.is_enabled && activeItems.length > 0)
    window.dispatchEvent(
      new CustomEvent('teenzos-announcement-visibility', {
        detail: { visible: isVisible },
      })
    )
  }, [config.is_enabled, activeItems.length, loaded])

  if (loaded && (!config.is_enabled || activeItems.length === 0)) {
    return null
  }

  const renderItems = activeItems.length > 0 ? activeItems : DEFAULT_TICKER_ITEMS

  return (
    <div
      className="fixed top-0 inset-x-0 z-[100000] bg-[#0B0D0E] border-b border-white/10 h-8 md:h-9 overflow-hidden select-none flex items-center group shadow-md"
      role="region"
      aria-label="Store Announcements"
    >
      {/* Smooth gradient fade masks on left and right for seamless look */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-[#0B0D0E] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-[#0B0D0E] to-transparent z-10" />

      {/* Marquee ticker container: slides right-to-left automatically & infinitely */}
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused] items-center"
        style={{ animationDuration: '55s' }}
      >
        {/* Set 1 */}
        <div className="flex items-center shrink-0">
          {renderItems.map((item, idx) => {
            const Icon = ICON_MAP[(item.icon as IconKey) || 'sparkles'] || Sparkles
            const theme = THEME_STYLES[item.badge_theme || 'cyan'] || THEME_STYLES.cyan
            const isEven = idx % 2 === 0

            return (
              <div key={`set1-${item.id}-${idx}`} className="flex items-center">
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4">
                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={`text-[8.5px] sm:text-[9.5px] font-black uppercase px-1.5 sm:px-2 py-[5px] rounded-[2px] tracking-[0.09em] leading-none shadow-sm ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${theme.iconColor} stroke-[2.2]`} />

                  {/* Message */}
                  <span className="font-body font-bold text-[10px] sm:text-[11px] md:text-[11.5px] text-[#F7F7F5] tracking-[0.08em] sm:tracking-[0.12em] uppercase whitespace-nowrap">
                    {item.text}
                  </span>
                </div>

                {/* Divider Icon between announcements */}
                <span
                  className={`text-[10px] sm:text-xs font-black select-none px-2 sm:px-3 ${
                    isEven ? 'text-[#36B8C5]' : 'text-[#F72585]'
                  }`}
                  aria-hidden="true"
                >
                  ✦
                </span>
              </div>
            )
          })}
        </div>

        {/* Set 2 (Identical duplicate for seamless continuous infinite loop) */}
        <div className="flex items-center shrink-0" aria-hidden="true">
          {renderItems.map((item, idx) => {
            const Icon = ICON_MAP[(item.icon as IconKey) || 'sparkles'] || Sparkles
            const theme = THEME_STYLES[item.badge_theme || 'cyan'] || THEME_STYLES.cyan
            const isEven = idx % 2 === 0

            return (
              <div key={`set2-${item.id}-${idx}`} className="flex items-center">
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4">
                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={`text-[8.5px] sm:text-[9.5px] font-black uppercase px-1.5 sm:px-2 py-[5px] rounded-[2px] tracking-[0.09em] leading-none shadow-sm ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${theme.iconColor} stroke-[2.2]`} />

                  {/* Message */}
                  <span className="font-body font-bold text-[10px] sm:text-[11px] md:text-[11.5px] text-[#F7F7F5] tracking-[0.08em] sm:tracking-[0.12em] uppercase whitespace-nowrap">
                    {item.text}
                  </span>
                </div>

                {/* Divider Icon */}
                <span
                  className={`text-[10px] sm:text-xs font-black select-none px-2 sm:px-3 ${
                    isEven ? 'text-[#36B8C5]' : 'text-[#F72585]'
                  }`}
                  aria-hidden="true"
                >
                  ✦
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
