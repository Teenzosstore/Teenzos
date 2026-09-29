import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import PageHeroBanner from "@/components/PageHeroBanner";
import FaqAccordionList from "./_components/FaqAccordionList";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'FAQ | Teenzosstore',
  description: 'Frequently asked questions about Teenzos streetwear products, oversized fit, shipping, returns, and more.',
};

async function getGlobalFaqs() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('global_faqs')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching global FAQs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching global FAQs:', err);
    return [];
  }
}

export default async function FAQPage() {
  const faqs = await getGlobalFaqs();

  return (
    <main className="overflow-x-hidden pt-[104px] md:pt-[116px] bg-cream min-h-screen flex flex-col">
      <Header />

      {/* ── Streetwear Graffiti Hero Banner (Shop Header Style) ── */}
      <PageHeroBanner title="FAQ" subtitle="FREQUENTLY ASKED QUESTIONS" />

      <div className="flex-1">
        <section id="faqs" className="relative py-10 md:py-14 bg-cream-deep/60">
          <div className="max-w-wrap mx-auto px-4 sm:px-6 md:px-8">
            <div className="max-w-[1350px] mx-auto">
              <FaqAccordionList initialFaqs={faqs} />
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
