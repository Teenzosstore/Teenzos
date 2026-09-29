'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Check,
  HelpCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  addGlobalFaq,
  updateGlobalFaq,
  deleteGlobalFaq,
  updateGlobalFaqOrders,
} from '@/actions/global_faqs'

type Faq = {
  id: string
  question: string
  answer: string
  display_order: number
}

export function GlobalFaqsEditor({ initialFaqs }: { initialFaqs: Faq[] }) {
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await addGlobalFaq(formData)
    if (res.success && res.data) {
      setFaqs([...faqs, res.data])
      setIsAdding(false)
      showToast('New FAQ added and published live!')
      form.reset()
    } else {
      alert(res.error || 'Error adding FAQ')
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this FAQ? It will be removed from the FAQ page.')) {
      return
    }
    setLoading(true)
    const res = await deleteGlobalFaq(id)
    if (res.success) {
      setFaqs(faqs.filter((f) => f.id !== id))
      showToast('FAQ deleted from store.')
    } else {
      alert(res.error || 'Error deleting FAQ')
    }
    setLoading(false)
  }

  async function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await updateGlobalFaq(id, formData)
    if (res.success && res.data) {
      setFaqs(faqs.map((f) => (f.id === id ? res.data : f)))
      setSavedId(id)
      setTimeout(() => setSavedId(null), 2500)
      showToast('FAQ updated & synced to public FAQ page!')
    } else {
      alert(res.error || 'Error updating FAQ')
    }
    setLoading(false)
  }

  const moveUp = async (index: number) => {
    if (index === 0) return
    const newFaqs = [...faqs]
    const temp = newFaqs[index].display_order
    newFaqs[index].display_order = newFaqs[index - 1].display_order
    newFaqs[index - 1].display_order = temp
    newFaqs.sort((a, b) => a.display_order - b.display_order)
    setFaqs(newFaqs)

    await updateGlobalFaqOrders([
      { id: newFaqs[index].id, display_order: newFaqs[index].display_order },
      { id: newFaqs[index - 1].id, display_order: newFaqs[index - 1].display_order },
    ])
    showToast('FAQ order updated!')
  }

  const moveDown = async (index: number) => {
    if (index === faqs.length - 1) return
    const newFaqs = [...faqs]
    const temp = newFaqs[index].display_order
    newFaqs[index].display_order = newFaqs[index + 1].display_order
    newFaqs[index + 1].display_order = temp
    newFaqs.sort((a, b) => a.display_order - b.display_order)
    setFaqs(newFaqs)

    await updateGlobalFaqOrders([
      { id: newFaqs[index].id, display_order: newFaqs[index].display_order },
      { id: newFaqs[index + 1].id, display_order: newFaqs[index + 1].display_order },
    ])
    showToast('FAQ order updated!')
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
          <Check className="w-4 h-4 text-green-600" />
          {toastMessage}
        </div>
      )}

      {/* Header bar with total counter and Live FAQ Page link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-cream-deep/70 rounded-xl border border-cream-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
            <HelpCircle className="w-5 h-5 text-gold-light" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">
                Global Questions ({faqs.length})
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-green-100 text-green-700 rounded-md">
                Live On Store
              </span>
            </div>
            <p className="text-xs text-ink/60 mt-0.5">
              These FAQs appear on the public <Link href="/faq" target="_blank" className="text-black font-semibold underline hover:text-[#F72585]">/faq</Link> page and on product detail pages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Link
            href="/faq"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-ink bg-panel border border-cream-line rounded-lg hover:bg-panel2 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#36B8C5]" />
            View Live FAQ Page
          </Link>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Global FAQ
          </button>
        </div>
      </div>

      {/* Add New FAQ Form Card */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="p-5 border-2 border-gold/40 rounded-2xl bg-panel shadow-md space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-cream-line">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide">
                Create New Global FAQ
              </h3>
            </div>
            <span className="text-xs text-ink/50">Visible on /faq immediately</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Question</label>
              <input
                type="text"
                name="question"
                placeholder="e.g. How long does express shipping take across India?"
                className="w-full px-3.5 py-2.5 bg-panel2 border border-cream-line rounded-lg text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Answer</label>
              <textarea
                name="answer"
                rows={3}
                placeholder="Provide a clear, helpful answer for your customers..."
                className="w-full px-3.5 py-2.5 bg-panel2 border border-cream-line rounded-lg text-sm text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-2 text-xs font-semibold text-ink/70 hover:text-ink bg-panel2 rounded-lg border border-cream-line"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-black bg-gold hover:bg-gold-light rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Save & Publish FAQ
            </button>
          </div>
        </form>
      )}

      {/* List of FAQs */}
      <div className="space-y-4">
        {faqs.length === 0 && !isAdding && (
          <div className="text-center py-12 bg-cream-deep/40 rounded-2xl border border-cream-line p-6">
            <HelpCircle className="w-10 h-10 text-ink/30 mx-auto mb-2" />
            <h4 className="font-bold text-ink text-sm">No Global FAQs Created</h4>
            <p className="text-xs text-ink/60 mt-1 max-w-sm mx-auto">
              Create your first question above to showcase FAQs on the storefront FAQ page.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-black rounded-lg"
            >
              Add First FAQ
            </button>
          </div>
        )}

        {faqs.map((faq, index) => {
          const isSaved = savedId === faq.id

          return (
            <form
              key={faq.id}
              onSubmit={(e) => handleUpdate(faq.id, e)}
              className="relative flex flex-col md:flex-row items-start gap-4 p-5 border border-cream-line rounded-2xl bg-cream-deep/50 hover:bg-cream-deep transition-all shadow-xs"
            >
              {/* Reorder and Index indicator */}
              <div className="flex md:flex-col items-center gap-1 pt-1 self-start">
                <span className="text-[11px] font-bold text-ink/40 w-5 text-center">
                  #{index + 1}
                </span>
                <div className="flex md:flex-col gap-0.5 ml-2 md:ml-0">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-ink/40 hover:text-ink hover:bg-panel2 rounded-md disabled:opacity-20 transition-colors cursor-pointer"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === faqs.length - 1}
                    className="p-1 text-ink/40 hover:text-ink hover:bg-panel2 rounded-md disabled:opacity-20 transition-colors cursor-pointer"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="flex-1 w-full space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink/60 uppercase mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    name="question"
                    defaultValue={faq.question}
                    className="block w-full rounded-lg bg-panel border border-cream-line py-2 px-3 text-ink font-semibold text-sm shadow-xs focus:ring-2 focus:ring-gold focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink/60 uppercase mb-1">
                    Answer
                  </label>
                  <textarea
                    name="answer"
                    rows={2}
                    defaultValue={faq.answer}
                    className="block w-full rounded-lg bg-panel border border-cream-line py-2 px-3 text-ink/80 text-sm leading-relaxed shadow-xs focus:ring-2 focus:ring-gold focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex md:flex-col items-center gap-2 pt-1 self-end md:self-auto shrink-0">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-3 py-2 text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1 min-w-[70px] transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-green-600 text-white'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Saved
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(faq.id)}
                  disabled={loading}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                  title="Delete this FAQ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )
        })}
      </div>
    </div>
  )
}
