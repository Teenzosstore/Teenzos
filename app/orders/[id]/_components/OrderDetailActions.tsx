'use client'

import { Printer, PhoneCall } from 'lucide-react'
import { SITE } from '@/lib/data'

export default function OrderDetailActions({ orderNumber }: { orderNumber: string }) {
  const handlePrint = () => {
    // The browser's "Save as PDF" filename comes from document.title, so set it
    // to the receipt name and only restore it once printing has finished
    // (restoring on a timer can wipe it before the print dialog even opens).
    const originalTitle = document.title
    document.title = `${SITE.name} Receipt - ${orderNumber}`

    const restoreTitle = () => {
      document.title = originalTitle
      window.removeEventListener('afterprint', restoreTitle)
    }
    window.addEventListener('afterprint', restoreTitle)

    // One extra tick so the browser registers the new title before the dialog opens.
    setTimeout(() => {
      window.print()
    }, 50)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold rounded-full shadow-sm transition-all"
      >
        <Printer className="w-4 h-4 text-pink" />
        Print Receipt
      </button>
      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hi, I need assistance with my Order #${orderNumber}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-full shadow-sm transition-all"
      >
        <PhoneCall className="w-4 h-4" />
        WhatsApp Support
      </a>
    </div>
  )
}
