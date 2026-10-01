'use client'

import React, { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { getCurrentUserForClient } from '@/actions/auth'
import {
  addToCart as addCartItemToDb,
  clearCart as clearDbCart,
  getCart as getDbCart,
  removeFromCart as removeCartItemFromDb,
  updateCartQuantity,
} from '@/actions/cart'

const LOCAL_CART_KEY = 'rawflex-cart'

export type CartItem = {
  cartItemId: string
  id: string
  name: string
  price: number
  image_url: string
  quantity: number
  category_name?: string
  variant_id?: string
  variant_name?: string
  isPersisted?: boolean
}

export type AddToCartOptions = {
  sourceElement?: HTMLElement | null
  event?: React.MouseEvent | MouseEvent | null
  clientX?: number
  clientY?: number
  skipFly?: boolean
  skipNotification?: boolean
  // How many units to add (defaults to 1) — used by "Buy Again".
  quantity?: number
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity' | 'cartItemId'>, options?: AddToCartOptions) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  openCart: () => void
  closeCart: () => void
  isCartBumping: boolean
  triggerCartBump: () => void
}

const defaultCartContext: CartContextType = {
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  cartCount: 0,
  cartTotal: 0,
  isCartOpen: false,
  setIsCartOpen: () => {},
  openCart: () => {},
  closeCart: () => {},
  isCartBumping: false,
  triggerCartBump: () => {},
}

const CartContext = createContext<CartContextType>(defaultCartContext)

function cartKey(item: Pick<CartItem, 'id' | 'variant_id'>) {
  return `${item.id}-${item.variant_id || 'default'}`
}

function readLocalCart() {
  if (typeof window === 'undefined') return []

  const savedCart = localStorage.getItem(LOCAL_CART_KEY)
  if (!savedCart) return []

  try {
    return JSON.parse(savedCart) as CartItem[]
  } catch (error) {
    console.error('Failed to load cart', error)
    return []
  }
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1
  return Math.max(1, Math.min(99, Math.floor(quantity)))
}

function upsertCartItem(cart: CartItem[], item: Omit<CartItem, 'quantity' | 'cartItemId'>, quantity: number) {
  const nextQuantity = normalizeQuantity(quantity)
  const nextKey = cartKey(item)

  const existing = cart.find((cartItem) => cartKey(cartItem) === nextKey)
  if (existing) {
    return cart.map((cartItem) =>
      cartKey(cartItem) === nextKey
        ? { ...cartItem, quantity: normalizeQuantity(cartItem.quantity + nextQuantity) }
        : cartItem
    )
  }

  return [
    ...cart,
    {
      ...item,
      cartItemId: nextKey,
      quantity: nextQuantity,
      isPersisted: false,
    },
  ]
}

function mapDbCartItem(row: any): CartItem | null {
  const variant = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants
  const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products
  if (!variant || !product) return null

  const productImages = Array.isArray(product.product_images) ? product.product_images : []
  const categories = Array.isArray(product.categories) ? product.categories[0] : product.categories

  return {
    cartItemId: row.id,
    id: product.id,
    name: product.name,
    price: Number(variant.price || 0),
    image_url: productImages[0]?.image_url || product.featured_image_url || '/image.png',
    quantity: normalizeQuantity(Number(row.quantity || 1)),
    category_name: categories?.name || undefined,
    variant_id: variant.id,
    variant_name: variant.variant_name || undefined,
    isPersisted: true,
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCartBumping, setIsCartBumping] = useState(false)
  const bumpTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  const triggerCartBump = useCallback(() => {
    setIsCartBumping(false)
    requestAnimationFrame(() => {
      setIsCartBumping(true)
      if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current)
      bumpTimeoutRef.current = setTimeout(() => {
        setIsCartBumping(false)
      }, 700)
    })
  }, [])

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      lastPointerPos.current = { x: e.clientX, y: e.clientY }
    }
    const handleTriggerBumpEvent = () => {
      triggerCartBump()
    }

    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('teenzos-trigger-cart-bump', handleTriggerBumpEvent)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('teenzos-trigger-cart-bump', handleTriggerBumpEvent)
      if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current)
    }
  }, [triggerCartBump])

  const refreshDbCart = async () => {
    const response = await getDbCart()
    if (!response.success) return

    setCart((response.items || []).map(mapDbCartItem).filter(Boolean) as CartItem[])
  }

  useEffect(() => {
    let mounted = true

    const hydrateCart = async () => {
      const guestCart = readLocalCart()
      if (mounted) {
        setCart(guestCart)
        setHydrated(true)
      }

      try {
        const { user } = await getCurrentUserForClient()
        if (!user || !mounted) {
          setIsLoggedIn(false)
          return
        }

        setIsLoggedIn(true)
        const cartToMerge = guestCart.filter((item) => item.variant_id && item.quantity > 0)
        for (const item of cartToMerge) {
          await addCartItemToDb(item.variant_id as string, item.quantity)
        }

        if (cartToMerge.length > 0) {
          localStorage.removeItem(LOCAL_CART_KEY)
        }

        await refreshDbCart()
      } catch (error) {
        console.error('Failed to hydrate persisted cart', error)
      }
    }

    hydrateCart()
    window.addEventListener('rawflex-login-status-change', hydrateCart)

    return () => {
      mounted = false
      window.removeEventListener('rawflex-login-status-change', hydrateCart)
    }
  }, [])

  useEffect(() => {
    if (!hydrated || isLoggedIn || typeof window === 'undefined') return
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart))
  }, [cart, hydrated, isLoggedIn])

  const addToCart = (
    item: Omit<CartItem, 'quantity' | 'cartItemId'>,
    options?: AddToCartOptions
  ) => {
    const quantity = normalizeQuantity(options?.quantity ?? 1)
    setCart((prev) => upsertCartItem(prev, item, quantity))

    if (isLoggedIn && item.variant_id) {
      addCartItemToDb(item.variant_id, quantity)
        .then((result) => {
          if (!result.success) {
            console.error(result.error || 'Failed to persist cart item')
          }
          return refreshDbCart()
        })
        .catch((error) => console.error('Failed to persist cart item', error))
    }

    // ── Trigger Modern Fly-To-Cart Animation ──
    if (typeof window !== 'undefined') {
      let startX = options?.clientX
      let startY = options?.clientY

      if ((startX === undefined || startY === undefined) && options?.sourceElement) {
        const rect = options.sourceElement.getBoundingClientRect()
        startX = rect.left + rect.width / 2
        startY = rect.top + rect.height / 2
      } else if ((startX === undefined || startY === undefined) && options?.event) {
        startX = options.event.clientX
        startY = options.event.clientY
      }

      if (startX === undefined || startY === undefined || (startX === 0 && startY === 0)) {
        startX = lastPointerPos.current.x || window.innerWidth / 2
        startY = lastPointerPos.current.y || window.innerHeight * 0.7
      }

      if (!options?.skipFly) {
        window.dispatchEvent(
          new CustomEvent('teenzos-fly-to-cart', {
            detail: {
              item,
              startX,
              startY,
            },
          })
        )
      } else if (!options?.skipNotification) {
        window.dispatchEvent(
          new CustomEvent('teenzos-item-added-direct', {
            detail: { item },
          })
        )
      }
    }
  }

  const removeFromCart = (cartItemId: string) => {
    const item = cart.find((cartItem) => cartItem.cartItemId === cartItemId)
    setCart((prev) => prev.filter((cartItem) => cartItem.cartItemId !== cartItemId))

    if (isLoggedIn && item?.isPersisted) {
      removeCartItemFromDb(cartItemId)
        .then((result) => {
          if (!result.success) {
            console.error(result.error || 'Failed to remove cart item')
            return refreshDbCart()
          }
        })
        .catch((error) => console.error('Failed to remove cart item', error))
    }
  }

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    const nextQuantity = normalizeQuantity(quantity)
    const item = cart.find((cartItem) => cartItem.cartItemId === cartItemId)
    setCart((prev) =>
      prev.map((cartItem) =>
        cartItem.cartItemId === cartItemId ? { ...cartItem, quantity: nextQuantity } : cartItem
      )
    )

    if (isLoggedIn && item?.isPersisted) {
      updateCartQuantity(cartItemId, nextQuantity)
        .then((result) => {
          if (!result.success) {
            console.error(result.error || 'Failed to update cart item')
            return refreshDbCart()
          }
        })
        .catch((error) => console.error('Failed to update cart item', error))
    }
  }

  const clearCart = () => {
    setCart([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_CART_KEY)
    }

    if (isLoggedIn) {
      clearDbCart().catch((error) => console.error('Failed to clear persisted cart', error))
    }
  }

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart])
  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        isCartBumping,
        triggerCartBump,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    return defaultCartContext
  }
  return context
}
