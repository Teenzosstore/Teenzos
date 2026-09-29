'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  ChevronDown,
  X,
  MessageCircle,
  Mail,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

export interface FaqItem {
  id: string
  question: string
  answer: string
  display_order?: number
}

interface FaqAccordionListProps {
  initialFaqs: FaqItem[]
}

const DEFAULT_FALLBACK_FAQS: FaqItem[] = [
  {
    id: 'f-1',
    question: 'What fabric and GSM do TeenZos oversized tees use?',
    answer:
      'Our signature oversized tees are crafted from 100% premium combed cotton with a heavyweight 240+ GSM build. They feature pre-shrunk fabric, reinforced ribbed collars, and a structured drop-shoulder fit that stays boxy wash after wash.',
  },
  {
    id: 'f-2',
    question: 'How long does shipping take across India?',
    answer:
      'We process and dispatch all orders within 24-48 hours from Ahmedabad. Metro cities typically receive deliveries within 2 to 4 business days, while other locations across India take 4 to 6 business days. Express tracking updates are sent via SMS and WhatsApp.',
  },
  {
    id: 'f-3',
    question: 'How can I apply coupon codes or promo discounts?',
    answer:
      'You can enter your promo or coupon code at checkout in the "Have a coupon code?" field. Hit "Apply" to see your instant discount before proceeding to payment. Note that promo codes are case-insensitive and only one code can be used per order.',
  },
  {
    id: 'f-4',
    question: 'What is your return or exchange policy?',
    answer:
      'We offer a hassle-free 7-day return and exchange policy for unworn, unwashed items with original tags intact. If you have sizing issues or received a defective item, head over to our Contact page or WhatsApp us with your Order ID.',
  },
  {
    id: 'f-5',
    question: 'How do I choose the right size for an oversized fit?',
    answer:
      'All our tees are custom patterned with a true boxy, relaxed oversized drop-shoulder cut. If you prefer the intended streetwear drape, pick your regular size. If you want a more standard, fitted look, size down. Check out our Size Chart for detailed chest, length, and sleeve measurements.',
  },
  {
    id: 'f-6',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major payment modes including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit & Debit Cards, Net Banking, and Cash on Delivery (COD). Enjoy extra discounts on prepaid orders!',
  },
  {
    id: 'f-7',
    question: 'How should I wash and care for my graphic streetwear tees?',
    answer:
      'To keep the heavyweight cotton and high-density screen prints looking fresh: machine wash cold inside out with like colors. Avoid direct ironing on the graphics, do not bleach, and tumble dry low or hang dry in shade.',
  },
]

export default function FaqAccordionList({ initialFaqs }: FaqAccordionListProps) {
  const faqs = initialFaqs && initialFaqs.length > 0 ? initialFaqs : DEFAULT_FALLBACK_FAQS
  const [searchQuery, setSearchQuery] = useState('')
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    [faqs[0]?.id || 'f-1']: true, // First FAQ open by default
  })

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const expandAll = () => {
    const next: Record<string, boolean> = {}
    faqs.forEach((f) => {
      next[f.id] = true
    })
    setOpenIds(next)
  }

  const collapseAll = () => {
    setOpenIds({})
  }

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return faqs
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    )
  }, [faqs, searchQuery])

  return (
    <div className="space-y-8">
     <div className="search-faqs max-w-5xl mx-auto space-y-6">
       {/* Search Bar & Filter Controls */}
      <div className="bg-panel rounded-[5px] border border-cream-line p-4 md:p-5 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. shipping, sizes, coupon, returns, wash care)..."
            className="w-full pl-11 pr-10 py-3 bg-cream-deep/70 border border-cream-line rounded-xl text-sm font-medium text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-[#F72585] focus:bg-panel transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink/40 hover:text-ink rounded-full hover:bg-cream-deep transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Counter & Expand / Collapse actions */}
        <div className="flex items-center justify-between text-xs text-ink/60 px-1 pt-1">
          <span>
            Showing <strong className="text-ink">{filteredFaqs.length}</strong> of{' '}
            {faqs.length} questions
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={expandAll}
              className="hover:text-ink font-semibold transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-cream-line font-bold">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="hover:text-ink font-semibold transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="space-y-3.5">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, idx) => {
            const isOpen = Boolean(openIds[faq.id])

            return (
              <div
                key={faq.id || idx}
                className={`bg-panel rounded-[5px] border transition-all duration-200 overflow-hidden shadow-xs ${
                  isOpen
                    ? 'border-[#36B8C5]/50 ring-1 ring-[#36B8C5]/20 shadow-md'
                    : 'border-cream-line hover:border-cream-line/90 hover:bg-panel/90'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left font-display font-[300] text-ink text-[15px] md:text-base px-6 py-5 cursor-pointer flex justify-between items-center outline-none list-none select-none transition-colors group"
                >
                  <span className="pr-4 leading-snug flex items-center gap-3">
                    <span className="text-[16px] font-display font-[300] text-[#F72585] shrink-0">
                      Q{idx + 1} .
                    </span>
                    <span className="group-hover:text-[#F72585] transition-colors">
                      {faq.question}
                    </span>
                  </span>

                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'rotate-180 bg-[#36B8C5]/15 text-[#36B8C5]'
                        : 'bg-cream-deep text-ink/50 group-hover:bg-cream-deep/80'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-ink/75 text-sm md:text-[15px] leading-relaxed border-t border-cream-line/50 mx-6 pt-4 animate-fade-in">
                    <p className="whitespace-pre-line">{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 bg-panel rounded-2xl border border-cream-line p-8 space-y-3">
            <HelpCircle className="w-10 h-10 text-ink/30 mx-auto" />
            <h3 className="font-bold text-ink text-base">No matching questions found</h3>
            <p className="text-xs text-ink/60 max-w-sm mx-auto">
              We couldn&apos;t find any FAQs matching &ldquo;{searchQuery}&rdquo;. Try another
              keyword or reach out to our team directly.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-2 px-4 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Clear Search Query
            </button>
          </div>
        )}
      </div>

     </div>

      {/* Support & Inquiry Card */}
      <div className="bg-gradient-to-br from-[#0B0D0E] to-[#1c1f21] rounded-[5px]  p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-[#F72585]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 -translate-x-10 translate-y-10 w-48 h-48 bg-[#36B8C5]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-black uppercase tracking-wider text-[#36B8C5]">
              <Sparkles className="w-3.5 h-3.5" />
              Need Personal Assistance?
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-[300] uppercase tracking-[0.08em]">
              Still have questions about your drop?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
              Our Ahmedabad streetwear crew is available to help with orders, sizing, exchanges, or custom drops.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="px-5 py-3 rounded-xl bg-white text-[#0B0D0E] font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-sm text-center"
            >
              <Mail className="w-4 h-4 text-[#F72585]" />
              Contact Support
            </Link>

            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#20ba59] transition-colors flex items-center justify-center gap-2 shadow-sm text-center"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
