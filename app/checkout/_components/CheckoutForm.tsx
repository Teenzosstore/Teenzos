"use client"

import React, { useState, useEffect, useTransition } from 'react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { validateCoupon } from '@/actions/admin/coupons'
import { calculateCheckoutTotals, cancelPendingRazorpayOrder, processCheckout, verifyRazorpayPayment } from '@/actions/checkout'
import { getCurrentCustomerProfileForClient, sendEmailOtp, verifyEmailOtp } from '@/actions/auth'
import { SITE } from '@/lib/data'
import {
  Truck,
  Tag,
  CreditCard,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  X,
  Loader2,
  ChevronDown,
  Check,
} from 'lucide-react'
import Image from 'next/image'
import Script from 'next/script'
import Link from 'next/link'

type ShippingSettings = {
  flat_rate: number
  free_threshold: number
  cod_charge?: number
  online_discount?: number
}

type CheckoutQuote = {
  subtotal: number
  shipping_cost: number
  cod_cost: number
  coupon_discount: number
  online_discount_amount: number
  total_amount: number
}

function parseItemVariants(variantName?: string) {
  if (!variantName) return { size: 'Free Size', color: null }

  const trimmed = variantName.trim()
  if (!trimmed || trimmed.toLowerCase() === 'standard') {
    return { size: 'Free Size', color: null }
  }

  const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL', 'FREE SIZE', 'OVERSIZED']

  // Case 1: "L / Black" or "L • Black"
  if (trimmed.includes(' / ') || trimmed.includes(' • ')) {
    const parts = trimmed.split(/\s*[\/•]\s*/)
    const part0Upper = parts[0].trim().toUpperCase()
    const part1Upper = (parts[1] || '').trim().toUpperCase()

    if (SIZES.includes(part0Upper)) {
      return { size: part0Upper, color: parts[1]?.trim() || null }
    }
    if (SIZES.includes(part1Upper)) {
      return { size: part1Upper, color: parts[0]?.trim() || null }
    }
    return { size: part0Upper, color: parts[1]?.trim() || null }
  }

  // Case 2: "Black - M" or "Color - Size" or "Size - Color"
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ')
    const part0Upper = parts[0].trim().toUpperCase()
    const part1Upper = (parts[1] || '').trim().toUpperCase()

    if (SIZES.includes(part1Upper)) {
      return { size: part1Upper, color: parts[0].trim() }
    }
    if (SIZES.includes(part0Upper)) {
      return { size: part0Upper, color: parts[1].trim() }
    }
    return { size: part1Upper, color: parts[0].trim() }
  }

  // Case 3: Exactly a size (e.g. "M", "L", "XL")
  if (SIZES.includes(trimmed.toUpperCase())) {
    return { size: trimmed.toUpperCase(), color: null }
  }

  // Case 4: Starts with size (e.g. "L (Black)")
  const sizeMatch = trimmed.match(/^(XXS|XS|S|M|L|XL|2XL|XXL|3XL|4XL)\b/i)
  if (sizeMatch) {
    const s = sizeMatch[1].toUpperCase()
    const rem = trimmed.replace(sizeMatch[0], '').replace(/[()/-]/g, '').trim()
    return { size: s, color: rem || null }
  }

  // Case 5: If it's a color (e.g. "Black", "Acid Wash"), size is Free Size
  return { size: 'Free Size', color: trimmed }
}

export default function CheckoutForm({
  shipping,
  isLoggedIn,
  hasCoupons = false,
  razorpayEnabled = false,
}: {
  shipping: ShippingSettings
  isLoggedIn: boolean
  hasCoupons?: boolean
  razorpayEnabled?: boolean
}) {
  const { cart, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart()
  const { showToast } = useToast()
  const [pending, startTransition] = useTransition()

  // Mobile Top Accordion State
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)

  // Shipping Address Form State
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  })

  // OTP States for Guest Checkout
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpPending, setOtpPending] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [otpError, setOtpError] = useState('')

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpSent, resendTimer])

  useEffect(() => {
    if (otpSent) {
      setResendTimer(60)
    }
  }, [otpSent])

  // Temporarily lower header z-index and freeze scrolling when OTP modal is open
  useEffect(() => {
    const header = document.querySelector('header')
    if (otpSent && !isLoggedIn) {
      if (header) {
        header.style.zIndex = '0'
      }
      document.body.style.overflow = 'hidden'
    } else {
      if (header) {
        header.style.zIndex = ''
      }
      document.body.style.overflow = ''
    }
    return () => {
      if (header) {
        header.style.zIndex = ''
      }
      document.body.style.overflow = ''
    }
  }, [otpSent, isLoggedIn])

  // Coupon State
  const [couponCode, setCouponCode] = useState('')
  const [activeCoupon, setActiveCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [serverQuote, setServerQuote] = useState<CheckoutQuote | null>(null)
  const [quoteError, setQuoteError] = useState('')

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Online Payment'>(
    razorpayEnabled ? 'Online Payment' : 'Cash on Delivery'
  )
  const isOnline = paymentMethod === 'Online Payment'
  const apiPaymentMethod = isOnline ? 'RAZORPAY' : 'COD'

  // Success Modal State
  const [placedOrder, setPlacedOrder] = useState<any>(null)

  // Prefill from localStorage on mount (Only if logged in)
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoggedIn) {
      const savedData = localStorage.getItem('rawflex-customer-profile')
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          setProfile({
            fullName: parsed.fullName || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            alternatePhone: parsed.alternatePhone || '',
            street: parsed.street || '',
            city: parsed.city || '',
            state: parsed.state || '',
            zipCode: parsed.zipCode || '',
          })
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [isLoggedIn])

  // Load user profile and default address from database if logged in
  useEffect(() => {
    if (isLoggedIn) {
      getCurrentCustomerProfileForClient()
        .then((result) => {
          if (result.profile) {
            setProfile(result.profile)
          }
        })
        .catch((err) => console.error('Failed to load profile in checkout:', err))
    }
  }, [isLoggedIn])

  // Calculate checkout details. Server quote wins once available.
  const clientSubtotal = cartTotal
  const clientShippingFee =
    clientSubtotal >= (shipping.free_threshold ?? 1999) ? 0 : shipping.flat_rate ?? 99
  const clientCodFee = isOnline ? 0 : shipping.cod_charge ?? 50

  let clientDiscount = 0
  if (activeCoupon) {
    if (activeCoupon.type === 'percentage') {
      clientDiscount = Math.round((clientSubtotal * activeCoupon.value) / 100)
    } else {
      clientDiscount = activeCoupon.value
    }
  }

  const clientOnlineDiscount = isOnline
    ? Math.round((clientSubtotal * (shipping.online_discount ?? 0)) / 100)
    : 0

  const clientGrandTotal = Math.max(
    0,
    clientSubtotal + clientShippingFee + clientCodFee - clientDiscount - clientOnlineDiscount
  )

  const subtotal = serverQuote?.subtotal ?? clientSubtotal
  const shippingFee = serverQuote?.shipping_cost ?? clientShippingFee
  const codFee = serverQuote?.cod_cost ?? clientCodFee
  const discount = serverQuote?.coupon_discount ?? clientDiscount
  const onlineDiscountAmount = serverQuote?.online_discount_amount ?? clientOnlineDiscount
  const grandTotal = serverQuote?.total_amount ?? clientGrandTotal

  // Threshold & Free Shipping Progress
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const freeThreshold = shipping?.free_threshold ?? 1999
  const amountNeededForFree = Math.max(0, freeThreshold - subtotal)
  const progressToFreeShipping = Math.min(100, Math.round((subtotal / freeThreshold) * 100))

  useEffect(() => {
    let active = true

    const refreshQuote = async () => {
      if (cart.length === 0) {
        setServerQuote(null)
        setQuoteError('')
        return
      }

      const result = await calculateCheckoutTotals(
        cart,
        apiPaymentMethod,
        activeCoupon ? couponCode : undefined
      )
      if (!active) return

      if (result.success === false) {
        setServerQuote(null)
        setQuoteError(result.error || 'Could not calculate checkout total.')
        return
      }

      setQuoteError('')
      setServerQuote({
        subtotal: result.subtotal,
        shipping_cost: result.shipping_cost,
        cod_cost: result.cod_cost,
        coupon_discount: result.coupon_discount,
        online_discount_amount: result.online_discount_amount,
        total_amount: result.total_amount,
      })
    }

    refreshQuote().catch((error) => {
      if (!active) return
      console.error('Failed to calculate server checkout quote:', error)
      setServerQuote(null)
      setQuoteError('Could not calculate checkout total.')
    })

    return () => {
      active = false
    }
  }, [cart, activeCoupon, couponCode, apiPaymentMethod])

  // Handle Coupon Apply
  const handleApplyCoupon = async () => {
    setCouponError('')
    setCouponSuccess('')

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.')
      return
    }

    const res = await validateCoupon(couponCode, subtotal)
    if (!res.success) {
      setCouponError(res.error || 'Invalid coupon code')
      setActiveCoupon(null)
    } else {
      setActiveCoupon(res.coupon)
      setCouponSuccess(
        `Coupon applied! Saved ${
          res.coupon.type === 'percentage' ? `${res.coupon.value}%` : `₹${res.coupon.value}`
        }`
      )
    }
  }

  // Handle Coupon Remove
  const handleRemoveCoupon = () => {
    setActiveCoupon(null)
    setCouponCode('')
    setCouponSuccess('')
    setCouponError('')
  }

  // Opens Razorpay Checkout for an order the server already created. The
  // handler only fires on a successful payment; the server re-verifies the
  // signature, and the Razorpay webhook confirms it again as a backup.
  const openRazorpay = (res: {
    razorpay: { keyId: string; orderId: string; amount: number; currency: string; name: string; email: string; contact: string }
    order_number: string
    orderId: string
  }) => {
    const Razorpay = (window as any).Razorpay
    if (!Razorpay) {
      showToast('Payment gateway is still loading. Please wait a moment and try again.', 'error')
      return
    }

    const options = {
      key: res.razorpay.keyId,
      amount: res.razorpay.amount,
      currency: res.razorpay.currency,
      name: SITE.name,
      description: `Order ${res.order_number}`,
      order_id: res.razorpay.orderId,
      prefill: {
        name: res.razorpay.name,
        email: res.razorpay.email,
        contact: res.razorpay.contact,
      },
      theme: { color: '#F72585' },
      modal: {
        ondismiss: () => {
          showToast('Payment cancelled. You can try again whenever you are ready.', 'info')
          // The pending order was created before the modal opened (Razorpay
          // needs a receipt up front) — clean it up so it doesn't sit in the
          // admin dashboard as an abandoned order. The server independently
          // confirms with Razorpay that nothing was actually paid before
          // touching anything.
          cancelPendingRazorpayOrder(res.orderId, res.razorpay.orderId).catch(() => {})
        },
      },
      handler: async (response: any) => {
        try {
          const verified = await verifyRazorpayPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          )
          if (verified.success === false) {
            showToast(verified.error, 'error')
            return
          }
          // The success page clears the cart and shows the paid order.
          window.location.assign(`/checkout/complete?order=${encodeURIComponent(verified.orderNumber)}`)
        } catch (e) {
          // The customer has been charged but our confirmation call failed —
          // the webhook will still mark it paid; tell them clearly meanwhile.
          console.error('Failed to verify Razorpay payment:', e)
          showToast(
            `Payment received, but we couldn't confirm it automatically. Please contact support with order ${res.order_number}.`,
            'error'
          )
        }
      },
    }

    try {
      const rzp = new Razorpay(options)
      rzp.on('payment.failed', (failure: any) => {
        showToast(`Payment failed: ${failure?.error?.description || 'please try again'}`, 'error')
      })
      rzp.open()
    } catch (e) {
      console.error('Failed to open Razorpay checkout:', e)
      showToast('Could not open the payment window. Please refresh and try again.', 'error')
    }
  }

  // Execute checkout and place order
  const executeOrderPlacement = async () => {
    const addressString = `${profile.street}, ${profile.city}, ${profile.state} - ${profile.zipCode}`

    // Save profile to localstorage on order place
    localStorage.setItem('rawflex-customer-profile', JSON.stringify(profile))

    const res = await processCheckout(profile, cart, apiPaymentMethod, activeCoupon ? couponCode : undefined)

    if (res.success === false) {
      showToast(res.error || 'Failed to place order.', 'error')
    } else if ('isRazorpay' in res && res.isRazorpay) {
      // Cart is cleared on the success page only after payment is verified.
      openRazorpay(res)
    } else {
      setPlacedOrder({
        order_number: res.order_number,
        id: res.orderId,
        total: res.totalAmount,
        items: [...cart],
        shippingAddress: addressString,
      })
      clearCart()
    }
  }

  // Handle Checkout Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error')
      return
    }

    if (
      !profile.fullName ||
      !profile.email ||
      !profile.phone ||
      !profile.street ||
      !profile.city ||
      !profile.state ||
      !profile.zipCode
    ) {
      showToast('Please fill out all shipping details.', 'error')
      return
    }

    if (!isLoggedIn) {
      if (!otpSent) {
        setOtpPending(true)
        startTransition(async () => {
          const res = await sendEmailOtp(profile.email, 'REGISTER', profile.fullName)
          setOtpPending(false)
          if (res?.error) {
            showToast(res.error, 'error')
          } else {
            setOtpSent(true)
            showToast('Verification code sent to ' + profile.email, 'success')
          }
        })
        return
      } else {
        if (!otpCode || otpCode.length !== 6) {
          showToast('Please enter a valid 6-digit verification code.', 'error')
          return
        }
        setOtpPending(true)
        startTransition(async () => {
          const res = await verifyEmailOtp(
            profile.email,
            otpCode,
            'NO_REDIRECT',
            profile.fullName,
            profile.phone
          )
          if (res?.error) {
            setOtpPending(false)
            setOtpError(res.error)
            showToast(res.error, 'error')
          } else if (res?.success) {
            try {
              window.dispatchEvent(new Event('rawflex-login-status-change'))
              await executeOrderPlacement()
              setOtpSent(false)
            } catch (e: any) {
              showToast(e.message || 'Error processing checkout', 'error')
            } finally {
              setOtpPending(false)
            }
          } else {
            setOtpPending(false)
          }
        })
        return
      }
    }

    startTransition(async () => {
      await executeOrderPlacement()
    })
  }

  // Format Whatsapp Link for Success Modal
  const getWhatsappLink = () => {
    if (!placedOrder) return ''
    const itemsText = placedOrder.items
      .map((i: any) => `- ${i.name} (x${i.quantity})`)
      .join('\n')
    const message = `Hi Teenzosstore!\n\nI just placed an order:\nOrder Number: *${placedOrder.order_number}*\nItems:\n${itemsText}\nTotal Amount: *₹${placedOrder.total.toLocaleString(
      'en-IN'
    )}*\nPayment Method: *${paymentMethod}*\n\nShipping Address: ${
      placedOrder.shippingAddress
    }\n\nPlease confirm my order. Thank you!`
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`
  }

  // Reusable Items List Component
  const renderCartItems = () => {
    if (cart.length === 0) {
      return (
        <div className="text-center py-8 px-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2.5">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Your bag is empty</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">Add items from the shop to checkout.</p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#0B0D0E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#F72585] transition-colors"
          >
            Browse Shop
          </Link>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {cart.map((item) => (
          <div
            key={item.cartItemId}
            className="flex gap-3.5 p-3 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 hover:border-gray-200 transition-all items-center group"
          >
            {/* Image Thumbnail with Floating Badge */}
            <div className="relative w-16 h-20 shrink-0">
              <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200/80 bg-white shadow-2xs relative">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#0B0D0E] text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-white z-10">
                {item.quantity}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/shop/${item.id}`}
                  className="hover:text-[#F72585] transition-colors font-semibold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-1"
                >
                  {item.name}
                </Link>
                <span className="font-bold text-xs sm:text-sm text-gray-900 shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Variant info */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                {(() => {
                  const { size, color } = parseItemVariants(item.variant_name)
                  return (
                    <>
                      {size && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-200/90 text-gray-900 font-bold uppercase text-[10px]">
                          Size: {size}
                        </span>
                      )}
                      {color && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold uppercase text-[10px]">
                          {color}
                        </span>
                      )}
                    </>
                  )
                })()}
                <span>• ₹{item.price.toLocaleString('en-IN')} each</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/60">
                <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-gray-900 select-none">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="text-gray-400 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50"
                  aria-label="Remove item"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Reusable Coupon Section
  const renderCouponSection = () => {
    return (
      <div className="pt-3 border-t border-gray-100 space-y-2">
        {activeCoupon ? (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-900">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    {activeCoupon.code}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200/90 text-emerald-900 px-1.5 py-0.5 rounded-full">
                    {activeCoupon.type === 'percentage'
                      ? `${activeCoupon.value}% OFF`
                      : `₹${activeCoupon.value} OFF`}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">Promo code applied</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="p-1 rounded-lg text-emerald-700 hover:text-rose-600 hover:bg-emerald-100/80 transition-colors"
              title="Remove coupon"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleApplyCoupon()
                    }
                  }}
                  placeholder="HAVE A COUPON CODE?"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E] transition-all text-xs font-semibold uppercase tracking-wider placeholder:text-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim()}
                className="px-4 py-2.5 bg-[#0B0D0E] hover:bg-[#F72585] text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
              >
                Apply
              </button>
            </div>

            {couponError && (
              <p className="text-xs text-rose-500 font-medium px-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-rose-500" />
                {couponError}
              </p>
            )}
            {couponSuccess && (
              <p className="text-xs text-emerald-600 font-medium px-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-600" />
                {couponSuccess}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Reusable Price Breakdown
  const renderPriceBreakdown = () => {
    return (
      <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Shipping / Delivery</span>
          <span className="font-semibold">
            {shippingFee === 0 ? (
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wide">
                FREE
              </span>
            ) : (
              <span className="text-gray-900">₹{shippingFee}</span>
            )}
          </span>
        </div>

        {!isOnline && (
          <div className="flex justify-between text-gray-600">
            <span>Cash on Delivery (COD) Fee</span>
            <span className="font-semibold text-gray-900">₹{codFee}</span>
          </div>
        )}

        {isOnline && onlineDiscountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Online Payment Discount</span>
            <span className="font-bold">-₹{onlineDiscountAmount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Coupon Discount {activeCoupon?.code ? `(${activeCoupon.code})` : ''}</span>
            <span className="font-bold">-₹{discount.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="border-t border-dashed border-gray-200 pt-3.5 mt-1 flex justify-between items-baseline">
          <div>
            <span className="font-bold text-sm sm:text-base text-gray-900 block leading-tight">
              Grand Total
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              Inclusive of all taxes & delivery charges
            </span>
          </div>
          <span className="font-display text-xl sm:text-2xl font-[380] text-gray-900 tracking-tight">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    )
  }

  // Success Confirmation Screen
  if (placedOrder) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-soft text-center space-y-6 animate-fade-in mt-4 sm:mt-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">
            ORDER PLACED SUCCESSFULLY!
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Thank you for shopping with Teenzos. We have received your order.
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100 text-left space-y-3">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500 uppercase font-semibold">Order Number</span>
            <span className="font-bold text-gray-900">{placedOrder.order_number}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500 uppercase font-semibold">Grand Total</span>
            <span className="font-bold text-emerald-600">
              ₹{placedOrder.total.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-500 uppercase font-semibold">Payment Method</span>
            <span className="font-bold text-gray-900">{paymentMethod}</span>
          </div>
          <div className="pt-2 border-t border-gray-200/60 text-xs text-gray-500">
            <span className="font-semibold block mb-0.5 text-gray-700">Delivery Address:</span>
            {placedOrder.shippingAddress}
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <a
            href={getWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-2xl shadow-md transition-all uppercase tracking-wider text-xs sm:text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.49 4.975 1.491 5.474 0 9.932-4.457 9.935-9.931a9.885 9.885 0 0 0-2.883-7.054A9.882 9.882 0 0 0 11.758 1.15c-5.483 0-9.94 4.458-9.944 9.934-.002 1.936.507 3.82 1.476 5.489L2.247 20.89l4.4-.736z" />
            </svg>
            Confirm via WhatsApp
          </a>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center py-3 text-xs sm:text-sm text-gray-500 hover:text-gray-900 font-bold uppercase tracking-wider transition-colors"
          >
            Return to Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {razorpayEnabled && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ======================================================== */}
        {/* MOBILE TOP COLLAPSIBLE ORDER SUMMARY (VISIBLE ON MOBILE) */}
        {/* ======================================================== */}
        <div className="lg:hidden col-span-1 bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100/80 active:bg-gray-100 transition-colors text-left"
            aria-expanded={mobileSummaryOpen}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F72585]/10 text-[#F72585] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    {mobileSummaryOpen ? 'Hide order summary' : 'Show order summary'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${
                      mobileSummaryOpen ? 'rotate-180 text-[#F72585]' : ''
                    }`}
                  />
                </div>
                <span className="text-[11px] text-gray-500 font-medium">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                Total
              </span>
              <span className="font-display text-base font-bold text-gray-900 tracking-tight">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </button>

          {/* Accordion Content */}
          {mobileSummaryOpen && (
            <div className="p-4 sm:p-5 border-t border-gray-100 space-y-4 bg-white animate-fade-in">
              {/* Free Shipping Progress */}
              {cart.length > 0 && (
                <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Truck className="w-3.5 h-3.5 text-[#F72585]" />
                      {amountNeededForFree === 0 ? (
                        <span className="font-bold text-emerald-600">🎉 FREE Shipping Unlocked!</span>
                      ) : (
                        <span>
                          Add <strong className="text-gray-900 font-bold">₹{amountNeededForFree.toLocaleString('en-IN')}</strong> for <strong className="text-[#F72585]">FREE Delivery</strong>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-500">{progressToFreeShipping}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#F72585] to-[#36B8C5] transition-all duration-300 rounded-full"
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
                {renderCartItems()}
              </div>

              {/* Coupon Form */}
              {renderCouponSection()}

              {/* Price Breakdown */}
              {renderPriceBreakdown()}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* LEFT COLUMN: Shipping Address & Payment Option            */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Details */}
          <div className="bg-white rounded-[5px] p-5 sm:p-7 md:p-8 border border-gray-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-[#0B0D0E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Truck className="w-4 h-4 text-[#36B8C5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-[300] text-gray-900 uppercase tracking-wider font-display">
                  Shipping Details
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">Where should we deliver your order?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#F72585]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="e.g. Sumaiya Khan"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E] transition-all text-sm placeholder:text-gray-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-[#F72585]">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={isLoggedIn}
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="e.g. sumaiya@example.com"
                  className={`w-full px-4 py-2.5 sm:py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none ${
                    isLoggedIn
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-[#F72585]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  title="Please enter exactly 10 digits"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E] transition-all text-sm placeholder:text-gray-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alternate Phone <span className="text-gray-400 normal-case font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  pattern="\d{10}"
                  title="Please enter exactly 10 digits"
                  value={profile.alternatePhone}
                  onChange={(e) =>
                    setProfile({ ...profile, alternatePhone: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E] transition-all text-sm placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Street Address <span className="text-[#F72585]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={profile.street}
                  onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                  placeholder="Flat, House no., Building, Street address"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E] transition-all text-sm placeholder:text-gray-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    City <span className="text-[#F72585]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="e.g. New Delhi"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E] transition-all text-sm placeholder:text-gray-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    State <span className="text-[#F72585]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    placeholder="e.g. Delhi"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E] transition-all text-sm placeholder:text-gray-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  PIN Code <span className="text-[#F72585]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  title="Please enter a valid 6-digit PIN code"
                  value={profile.zipCode}
                  onChange={(e) =>
                    setProfile({ ...profile, zipCode: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="e.g. 110001"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0D0E]/15 focus:border-[#0B0D0E] transition-all text-sm placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Payment Option */}
          <div className="bg-white rounded-[5px] p-5 sm:p-7 border border-gray-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-[#0B0D0E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <CreditCard className="w-4 h-4 text-[#F72585]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-[300] text-gray-900 uppercase tracking-wider font-display">
                  Payment Method
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">Select your preferred payment option</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {razorpayEnabled && (
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-[5px] border-2 cursor-pointer transition-all ${
                    isOnline
                      ? 'border-[#0B0D0E] bg-gray-50/80'
                      : 'border-gray-200 hover:bg-gray-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={isOnline}
                    onChange={() => setPaymentMethod('Online Payment')}
                    className="mt-1 w-4 h-4 text-[#0B0D0E] focus:ring-[#0B0D0E]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900">
                        Pay Online (UPI / Cards / Net Banking)
                      </span>
                      {(shipping.online_discount ?? 0) > 0 && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {shipping.online_discount}% OFF
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 block mt-1">
                      Secure payment via Razorpay. No COD fee.
                    </span>
                  </div>
                </label>
              )}

              <label
                className={`flex items-start gap-3.5 p-4 rounded-[5px] border-2 cursor-pointer transition-all ${
                  !isOnline
                    ? 'border-[#0B0D0E] bg-gray-50/80'
                    : 'border-gray-200 hover:bg-gray-50/60'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={!isOnline}
                  onChange={() => setPaymentMethod('Cash on Delivery')}
                  className="mt-1 w-4 h-4 text-[#0B0D0E] focus:ring-[#0B0D0E]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-xs font-bold text-gray-900 bg-gray-200/80 px-2 py-0.5 rounded-full">
                      +₹{shipping.cod_charge ?? 50}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 block mt-1">
                    Pay securely with cash or UPI at your doorstep upon delivery.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Modern Responsive Order Summary Card       */}
        {/* (Sticky on desktop, full view at bottom for mobile)       */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="bg-white rounded-[5px] p-5 sm:p-7 border border-gray-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B0D0E] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShoppingBag className="w-4 h-4 text-[#F72585]" />
                </div>
                <div>
                  <h2 className="text-base font-[300] text-gray-900 uppercase tracking-wider font-display">
                    Order Summary
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">Review your items and total</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F72585]/10 text-[#F72585] border border-[#F72585]/20">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Free Shipping Progress Indicator */}
            {cart.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-pink-soft/30 rounded-2xl p-3 sm:p-3.5 border border-gray-100/80">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <div className="flex items-center gap-1.5 text-gray-800">
                    <Truck className="w-3.5 h-3.5 text-[#F72585] shrink-0" />
                    {amountNeededForFree === 0 ? (
                      <span className="font-bold text-emerald-600">
                        🎉 FREE Express Shipping Unlocked!
                      </span>
                    ) : (
                      <span>
                        Add <strong className="text-gray-900 font-bold">₹{amountNeededForFree.toLocaleString('en-IN')}</strong> for <strong className="text-[#F72585]">FREE Shipping</strong>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-600">{progressToFreeShipping}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#F72585] to-[#36B8C5] transition-all duration-300 rounded-full"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="max-h-[340px] overflow-y-auto pr-1">
              {renderCartItems()}
            </div>

            {/* Integrated Coupon Box */}
            {renderCouponSection()}

            {/* Price Calculations */}
            {renderPriceBreakdown()}

            {/* Quote Error Warning */}
            {quoteError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                {quoteError}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={pending || otpPending || !!quoteError || cart.length === 0}
              className="w-full py-4 px-6 bg-[#0B0D0E] hover:bg-[#F72585] active:scale-[0.98] text-white font-body font-bold rounded-2xl shadow-md hover:shadow-pink transition-all duration-300 flex items-center justify-center gap-2.5 text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {pending || otpPending ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>
                    {isLoggedIn
                      ? `${isOnline ? 'Pay Now' : 'Place Order'} • ₹${grandTotal.toLocaleString('en-IN')}`
                      : otpSent
                      ? 'Confirm OTP & Place Order'
                      : 'Verify Email & Place Order'}
                  </span>
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/80">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">
                  100% Secure
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/80">
                <Truck className="w-4 h-4 text-[#36B8C5]" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">
                  Express Delivery
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/80">
                <CheckCircle2 className="w-4 h-4 text-[#F72585]" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">
                  {razorpayEnabled ? 'UPI / COD' : 'COD Available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ======================================================== */}
      {/* OTP VERIFICATION MODAL FOR GUESTS                        */}
      {/* ======================================================== */}
      {!isLoggedIn && otpSent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-2xl text-center space-y-6 relative overflow-y-auto max-h-[90vh] sm:max-h-none">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="absolute right-4 top-4 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-[#F72585]/10 text-[#F72585] rounded-full flex items-center justify-center mx-auto border border-[#F72585]/20 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
                VERIFY YOUR EMAIL
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 font-body px-1">
                We sent a 6-digit OTP code to{' '}
                <strong className="text-gray-900 font-semibold">{profile.email}</strong>. Enter it
                below to confirm your order.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''))
                    setOtpError('')
                  }}
                  placeholder="123456"
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-center tracking-[0.5em] font-display font-bold text-2xl text-gray-900 focus:outline-none focus:border-[#0B0D0E] focus:ring-2 focus:ring-[#0B0D0E]/10 transition-all shadow-inner"
                />
              </div>

              {otpError && (
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs border border-rose-100 font-medium">
                  {otpError}
                </div>
              )}

              <div className="text-xs text-center font-body">
                {resendTimer > 0 ? (
                  <span className="text-gray-500 bg-gray-100 py-1 px-3 rounded-full">
                    Resend code in <strong className="text-gray-900 font-bold">{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setOtpPending(true)
                      const res = await sendEmailOtp(profile.email, 'REGISTER', profile.fullName)
                      setOtpPending(false)
                      if (res?.error) {
                        showToast(res.error, 'error')
                      } else {
                        setResendTimer(60)
                        showToast('Verification code resent successfully.', 'success')
                      }
                    }}
                    className="text-[#F72585] hover:underline font-bold transition-colors"
                  >
                    Resend Verification Code
                  </button>
                )}
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={otpPending || otpCode.length !== 6}
                  onClick={() => {
                    setOtpPending(true)
                    startTransition(async () => {
                      const res = await verifyEmailOtp(
                        profile.email,
                        otpCode,
                        'NO_REDIRECT',
                        profile.fullName,
                        profile.phone
                      )
                      if (res?.error) {
                        setOtpPending(false)
                        setOtpError(res.error)
                        showToast(res.error, 'error')
                      } else if (res?.success) {
                        try {
                          window.dispatchEvent(new Event('rawflex-login-status-change'))
                          await executeOrderPlacement()
                          setOtpSent(false)
                        } catch (e: any) {
                          showToast(e.message || 'Error processing checkout', 'error')
                        } finally {
                          setOtpPending(false)
                        }
                      } else {
                        setOtpPending(false)
                      }
                    })
                  }}
                  className="flex-1 py-3 px-4 bg-[#0B0D0E] hover:bg-[#F72585] text-white rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify & Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
