'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-ink/40 text-xs break-all">{id}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded hover:bg-cream-deep text-ink/40 hover:text-ink/70 transition-colors focus:outline-none shrink-0"
        title="Copy full ID"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  )
}
