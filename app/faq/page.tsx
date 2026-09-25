import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: 'FAQ | Teenzosstore',
  description: 'Frequently asked questions about Teenzosstore products, shipping, returns, and more.',
}

async function getGlobalFaqs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('global_faqs')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching global FAQs:', error)
    return []
  }

  return data || []
}

export default async function FAQPage() {
  const faqs = await getGlobalFaqs()

  return (
    <main className="overflow-x-hidden pt-[108px] md:pt-[120px] bg-cream min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Banner for FAQ Page */}
      <section className="relative w-full py-10 md:py-14 bg-black flex items-center justify-center overflow-hidden border-b border-cream-line">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#111111] to-[#0d0d0d] opacity-90" />

        <div className="relative z-10 text-center px-5">
          <div className="eyebrow justify-center inline-flex items-center gap-2 mb-3 text-gold-light">
            <span className="h-px w-6 bg-gold-light/50" />
            Support
            <span className="h-px w-6 bg-gold-light/50" />
          </div>
          <h1 className="font-display font-semibold text-3xl md:text-5xl text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-gold-light/75 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Quick answers about our products, shipping, returns, sizing, and orders.
          </p>
        </div>
      </section>

      <div className="flex-1">
        <section id="faqs" className="relative py-12 md:py-16 bg-cream-deep/60">
          <div className="max-w-wrap mx-auto px-5 md:px-8">
            <div className="max-w-3xl mx-auto">

              <div className="space-y-4">
                {faqs.length > 0 ? (
                  faqs.map((faq: any) => (
                    <details key={faq.id} className="group bg-panel rounded-2xl border border-cream-line shadow-sm overflow-hidden transition-colors duration-300">
                      <summary className="font-display font-semibold text-ink text-[15px] md:text-base px-6 py-5 cursor-pointer flex justify-between items-center outline-none list-none hover:text-emerald transition-colors">
                        {faq.question}
                        <span className="w-8 h-8 rounded-full bg-cream-deep flex items-center justify-center transition-transform group-open:rotate-180 group-open:bg-emerald/10 group-open:text-emerald text-ink/50">
                          <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                      </summary>
                      <div className="px-6 pb-6 text-ink/70 text-sm md:text-[15px] leading-relaxed border-t border-cream-line/50 mx-6 pt-4">
                        {faq.answer}
                      </div>
                    </details>
                  ))
                ) : (
                  <div className="text-center py-12 bg-panel rounded-2xl border border-cream-line">
                    <p className="text-ink/60">No FAQs available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
