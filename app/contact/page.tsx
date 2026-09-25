import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import Contact from "@/components/Contact";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Contact Us | Teenzosstore",
  description:
    "Get in touch with Teenzosstore for inquiries, order tracking, sizing guidance, and customer support.",
};

async function getGlobalFaqs() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("global_faqs")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching global FAQs:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    return [];
  }
}

export default async function ContactPage() {
  const faqs = await getGlobalFaqs();

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F7F7F6] pt-[104px] md:pt-[116px]">
        {/* ── Streetwear Graffiti Hero Banner (Shop Header Style) ── */}
        <PageHeroBanner title="CONTACT US" subtitle="HIT US UP & WE'RE HERE TO HELP" />

        {/* ── Main Content Container ── */}
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 pb-16 sm:pb-24">
          <Contact faqs={faqs} />
        </div>
      </main>

      <Footer />
    </>
  );
}
