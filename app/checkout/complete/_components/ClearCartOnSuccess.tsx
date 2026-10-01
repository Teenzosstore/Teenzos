'use client'

import { useEffect } from 'react'
import { useCart } from '@/context/CartContext'

export default function ClearCartOnSuccess() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
