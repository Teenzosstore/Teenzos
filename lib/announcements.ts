export interface AnnouncementTickerItem {
  id: string
  text: string
  badge?: string
  badge_theme?: 'cyan' | 'pink' | 'orange' | 'white' | 'soft-pink' | 'cyan-subtle'
  icon?: 'truck' | 'zap' | 'flame' | 'sparkles' | 'tag' | 'shield' | 'megaphone' | 'star'
  is_active: boolean
}

export interface CouponTickerConfig {
  is_enabled: boolean
  coupon_code?: string
  badge: string
  badge_theme?: 'cyan' | 'pink' | 'orange' | 'white' | 'soft-pink' | 'cyan-subtle'
  icon?: 'tag' | 'zap' | 'flame' | 'sparkles' | 'star' | 'truck' | 'shield' | 'megaphone'
  text: string
}

export interface AnnouncementsConfig {
  is_enabled: boolean
  items: AnnouncementTickerItem[]
  coupon_item?: CouponTickerConfig
}

export const DEFAULT_COUPON_TICKER: CouponTickerConfig = {
  is_enabled: true,
  coupon_code: 'TEENZOS10',
  badge: 'CODE: TEENZOS10',
  badge_theme: 'white',
  icon: 'tag',
  text: 'GET 10% OFF ON YOUR FIRST STREETWEAR ORDER • USE CODE TEENZOS10',
}

export const DEFAULT_TICKER_ITEMS: AnnouncementTickerItem[] = [
  {
    id: 'shipping',
    badge: 'FREE DELIVERY',
    badge_theme: 'cyan',
    icon: 'truck',
    text: 'PAN-INDIA EXPRESS SHIPPING ON ALL ORDERS',
    is_active: true,
  },
  {
    id: 'prepaid',
    badge: 'PREPAID DROP',
    badge_theme: 'pink',
    icon: 'zap',
    text: 'EXTRA 10% OFF ON UPI & PREPAID ORDERS',
    is_active: true,
  },
  {
    id: 'new-drop',
    badge: 'NEW COLLECTION',
    badge_theme: 'orange',
    icon: 'flame',
    text: 'CYBERPUNK & ACID-WASH OVERSIZED TEES LIVE NOW',
    is_active: true,
  },
  {
    id: 'fabric',
    badge: '240+ GSM',
    badge_theme: 'soft-pink',
    icon: 'sparkles',
    text: 'HEAVYWEIGHT COMBED COTTON • SIGNATURE BOX DROPS',
    is_active: true,
  },
  {
    id: 'culture',
    badge: 'ORIGINAL STREETWEAR',
    badge_theme: 'cyan-subtle',
    icon: 'shield',
    text: 'CRAFTED IN AHMEDABAD • MADE FOR THE NEW GENERATION',
    is_active: true,
  },
]

export const DEFAULT_ANNOUNCEMENTS_CONFIG: AnnouncementsConfig = {
  is_enabled: true,
  items: DEFAULT_TICKER_ITEMS,
  coupon_item: DEFAULT_COUPON_TICKER,
}

