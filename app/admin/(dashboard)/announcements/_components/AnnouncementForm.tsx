'use client'

import { useState, useTransition } from 'react'
import { saveAnnouncement } from '@/actions/admin/announcements'
import { Check, Loader2, Megaphone } from 'lucide-react'

export function AnnouncementForm({ 
  initialMessage, 
  initialIsActive 
}: { 
  initialMessage: string
  initialIsActive: boolean 
}) {
  const [message, setMessage] = useState(initialMessage)
  const [isActive, setIsActive] = useState(initialIsActive)
  
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = () => {
    if (!message.trim() && isActive) {
      setError('Message cannot be empty when announcement is active.')
      return
    }

    setError(null)
    setSuccess(false)
    
    startTransition(async () => {
      const result = await saveAnnouncement(message, isActive)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="bg-panel rounded-2xl shadow-sm border border-cream-line p-6 sm:p-8">
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-6">
        
        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-cream-deep rounded-xl border border-cream-line">
          <div>
            <h3 className="font-bold text-ink">Enable Announcement Banner</h3>
            <p className="text-sm text-ink/60">Show this banner to all visitors at the top of the store.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isPending}
            />
            <div className="w-11 h-6 bg-panel2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-ink/50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink after:border-ink/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-bold text-ink/80 mb-2">
            Announcement Message
          </label>
          <div className="relative">
            <Megaphone className="absolute left-4 top-3.5 w-5 h-5 text-ink/40" />
            <input
              type="text"
              maxLength={255}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Free Shipping on all orders over ₹500!"
              disabled={isPending}
              className="w-full pl-12 pr-4 py-3 bg-cream-deep border border-cream-line rounded-xl text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-ink/30"
            />
          </div>
          <p className="text-xs text-ink/60 mt-2">Keep it short and engaging for the best results.</p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-cream-line flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2.5 bg-panel text-ink text-sm font-bold rounded-xl hover:bg-panel2 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
          </button>
          
          {success && (
            <span className="flex items-center gap-2 text-sm font-medium text-green-600">
              <Check className="w-4 h-4" />
              Saved successfully!
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
