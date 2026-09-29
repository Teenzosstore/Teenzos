import { getGlobalFaqs } from '@/actions/global_faqs'
import { GlobalFaqsEditor } from '@/components/admin/GlobalFaqsEditor'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Global FAQs | Teenzosstore Admin',
}

export default async function GlobalFaqsPage() {
  const { data: initialFaqs } = await getGlobalFaqs()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Global FAQs</h1>
        <p className="mt-1 text-sm text-ink/60">
          Manage the universal frequently asked questions that apply to your store.
        </p>
      </div>

      <div className="bg-panel p-6 shadow-sm ring-1 ring-ink/10 sm:rounded-xl">
        <GlobalFaqsEditor initialFaqs={initialFaqs || []} />
      </div>
    </div>
  )
}
