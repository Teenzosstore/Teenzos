'use client'

import React, { useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type CartDrawerProps = {
  isOpen: boolean
  onClose: () => void
  shipping?: any
}

export default function CartDrawer({ isOpen, onClose, shipping }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart()

  const flatRate = shipping?.flat_rate ?? 99
  const freeThreshold = shipping?.free_threshold ?? 1999
  const codCharge = shipping?.cod_charge ?? 49
  const onlineDiscount = shipping?.online_discount ?? 5

  const progressToFreeShipping = Math.min(100, Math.round((cartTotal / freeThreshold) * 100))
  const amountNeededForFree = Math.max(0, freeThreshold - cartTotal)

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100000] overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop with dark blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Drawer Panel */}
        <div
          className="w-screen max-w-[92vw] sm:max-w-md lg:max-w-[460px] bg-white flex flex-col shadow-2xl border-l border-gray-200/90 relative"
          style={{
            animation: 'drawerSlideLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Header */}
          <div className="h-16 sm:h-[72px] border-b border-gray-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FF007A]/10 text-[#FF007A] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold uppercase tracking-wider text-xl text-gray-900">
                  MY CART
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF007A]/10 text-[#FF007A]">
                  {cartCount}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator (if items in cart) */}
          {cart.length > 0 && (
            <div className="bg-gray-50/90 border-b border-gray-200/80 px-4 sm:px-6 py-2.5 shrink-0">
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Truck className="w-3.5 h-3.5 text-[#FF007A]" />
                  {amountNeededForFree === 0 ? (
                    <span className="font-bold text-emerald-600">
                      🎉 Free Shipping Unlocked!
                    </span>
                  ) : (
                    <span>
                      Add <strong className="text-gray-900 font-bold">₹{amountNeededForFree.toLocaleString('en-IN')}</strong> for <strong className="text-[#FF007A]">FREE Shipping</strong>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-gray-500">
                  {progressToFreeShipping}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF007A] to-[#36B8C5] transition-all duration-300 rounded-full"
                  style={{ width: `${progressToFreeShipping}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-[#FF007A]/10 text-[#FF007A] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-display font-[300] uppercase tracking-wider text-xl text-gray-900 mb-1">
                  YOUR BAG IS EMPTY
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm max-w-[260px] mb-6 leading-relaxed">
                  Looks like you haven&apos;t added any streetwear heat to your bag yet.
                </p>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0B0D0E] hover:bg-[#FF007A] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm"
                >
                  START SHOPPING
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-3 sm:gap-3.5 p-3 rounded-xl border border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-xs transition-all"
                >
                  {/* Product thumbnail */}
                  <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover object-center"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-gray-400 hover:text-rose-500 transition-colors p-1 -mr-1 rounded-md hover:bg-rose-50 shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant & Category metadata */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.variant_name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-800">
                            Size: {item.variant_name}
                          </span>
                        )}
                        {item.category_name && (
                          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                            {item.category_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Quantity Stepper + Price */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                      {/* Stepper */}
                      <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 sm:w-7 text-center text-xs font-bold text-gray-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="font-bold text-sm sm:text-base text-gray-900 tracking-tight">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer actions */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200/90 p-4 sm:p-5 space-y-3.5 shrink-0 bg-white shadow-[0_-6px_20px_rgba(0,0,0,0.04)]">
              {/* Subtotal */}
              <div className="flex justify-between items-baseline">
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Subtotal</span>
                <span className="font-display font-[350] text-2xl text-gray-900 tracking-tight">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Shipping info note */}
              <div className="bg-gray-50 rounded-lg p-2.5 text-[11px] text-gray-600 leading-relaxed border border-gray-100 flex items-start gap-2">
                <Truck className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p>
                    Standard shipping is <strong>₹{flatRate}</strong> (or <strong>FREE</strong> on orders above <strong>₹{freeThreshold.toLocaleString('en-IN')}</strong>).
                  </p>
                  {onlineDiscount > 0 && (
                    <p className="text-emerald-600 font-semibold mt-0.5">
                      ⚡ Extra {onlineDiscount}% OFF on Prepaid / UPI orders!
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full text-center py-3.5  bg-[#0B0D0E] hover:bg-[#FF007A] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  onClick={onClose}
                  className="w-full text-center py-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wide"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
