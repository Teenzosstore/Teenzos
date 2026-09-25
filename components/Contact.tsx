"use client";

import React, { useState } from "react";
import { SITE } from "@/lib/data";
import { submitInquiry } from "@/actions/contact";
import {
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Instagram,
  Youtube,
  ArrowUpRight,
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

export default function Contact({ faqs = [] }: { faqs?: FAQ[] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const phoneVal = formData.get("phone") as string;
    const msg = formData.get("message") as string;
    if (phoneVal) {
      formData.set("message", `Phone: ${phoneVal}\n\n${msg}`);
    }

    try {
      const res = await submitInquiry(formData);
      if (res.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError(res.error || "Failed to send message. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please contact us on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const DEFAULT_FAQS: FAQ[] = [
    {
      id: "f1",
      question: "How do I track my TeenZos order?",
      answer:
        "Once your order dispatches, you will receive real-time tracking details on WhatsApp and SMS. You can also message us directly on WhatsApp with your Order ID for instant updates.",
      display_order: 1,
    },
    {
      id: "f2",
      question: "What are the shipping delivery timelines?",
      answer:
        "Deliveries within Gujarat take 1-2 business days. Metro cities take 3-4 business days, and the rest of India takes 4-6 business days with tracked express shipping.",
      display_order: 2,
    },
    {
      id: "f3",
      question: "What is your return & exchange policy?",
      answer:
        "We offer a 7-day hassle-free return and exchange policy on unworn items with original tags. Ping our support team on WhatsApp or email to initiate an exchange.",
      display_order: 3,
    },
    {
      id: "f4",
      question: "How do TeenZos oversized tees fit?",
      answer:
        "Our tees feature an engineered boxy, drop-shoulder cut. If you love a true oversized streetwear look, order your standard size. For a regular fit, consider sizing down.",
      display_order: 4,
    },
  ];

  const displayedFaqs = faqs.length > 0 ? faqs : DEFAULT_FAQS;

  return (
    <div className="space-y-6 sm:space-y-12">
      {/* ── Top Quick Action Cards (Compact 3-Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* WhatsApp Card */}
        <a
          href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
            "Hi TeenZos! I have a question about an order / product."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-[5px] p-4 sm:p-5 border border-stone-200/90 shadow-xs hover:border-[#25D366] hover:shadow-md transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-11 h-11 rounded-[5px] bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Instant Chat
              </span>
              <p className="font-display font-[350] text-base text-[#0B0D0E] group-hover:text-[#25D366] transition-colors">
                WhatsApp
              </p>
              <span className="text-[11px] text-stone-500 font-medium block">
                Avg reply: &lt; 15 mins
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-[#25D366] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>

        {/* Call Card */}
        <a
          href={`tel:${SITE.phoneHref}`}
          className="bg-white rounded-[5px] p-4 sm:p-5 border border-stone-200/90 shadow-xs hover:border-[#36B8C5] hover:shadow-md transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-11 h-11 rounded-[5px] bg-[#36B8C5]/10 text-[#36B8C5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Direct Call
              </span>
              <p className="font-display font-[350] text-base text-[#0B0D0E] group-hover:text-[#36B8C5] transition-colors">
                {SITE.phone}
              </p>
              <span className="text-[11px] text-stone-500 font-medium block">
                10:00 AM – 8:00 PM
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-[#36B8C5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>

        {/* Email Card */}
        <a
          href={`mailto:${SITE.email}`}
          className="bg-white rounded-[5px] p-4 sm:p-5 border border-stone-200/90 shadow-xs hover:border-[#F72585] hover:shadow-md transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-11 h-11 rounded-[5px] bg-[#F72585]/10 text-[#F72585] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Mail Desk
              </span>
              <p className="font-display font-[350] text-base text-[#0B0D0E] group-hover:text-[#F72585] transition-colors  max-w-[160px]">
                {SITE.email}
              </p>
              <span className="text-[11px] text-stone-500 font-medium block">
                Official queries
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-[#F72585] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>
      </div>

      {/* ── Main Split Card: Left Studio Info / Right Interactive Form ── */}
      <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: HQ & Studio Info Card (Dark Streetwear Aesthetic) */}
        <div className="lg:col-span-5 bg-[#0B0D0E] rounded-[5px] p-6 sm:p-7 text-white border border-white/10 shadow-lg space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-52 h-52 bg-[#F72585]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F72585]" />
              Store & Hub
            </div>
            <h3 className="font-display font-[350] text-2xl uppercase tracking-wide text-white">
              TeenZos Studio
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
              Have a custom inquiry, collaboration, sizing question, or bulk order? We are always ready to assist.
            </p>
          </div>

          {/* Details list */}
          <div className="relative z-10 space-y-3.5 text-xs sm:text-[13px] border-t border-white/10 pt-4">
            {/* Store & Proprietor */}
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-[#F72585] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-stone-400 block uppercase font-medium">Brand & Proprietor</span>
                <span className="text-white font-semibold">Teenzosstore</span>
                <span className="text-stone-300 block text-xs">Proprietor: {SITE.proprietor}</span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#36B8C5] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-stone-400 block uppercase font-medium">Address</span>
                <p className="text-stone-200 font-medium leading-relaxed">
                  {SITE.address}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#F72585] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-stone-400 block uppercase font-medium">Phone Lines</span>
                <div className="flex flex-col gap-0.5">
                  <a href={`tel:${SITE.phoneHref}`} className="text-white hover:text-[#F72585] transition-colors font-medium">
                    {SITE.phone} (Primary / WhatsApp)
                  </a>
                  <a href={`tel:${SITE.secondaryPhoneHref}`} className="text-stone-300 hover:text-[#F72585] transition-colors font-medium">
                    {SITE.secondaryPhone} (Proprietor Contact)
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-stone-400 block uppercase font-medium">Operational Hours</span>
                <p className="text-stone-300 font-medium">Monday – Saturday: 10:00 AM – 8:00 PM</p>
              </div>
            </div>
          </div>

          {/* Compact Google Map */}
          <div className="relative z-10 w-full h-36 sm:h-40 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
            <iframe
              src="https://maps.google.com/maps?q=Fatehwadi,+Gyaspur,+Ahmedabad+382405&t=&z=14&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="TeenZos Studio Ahmedabad"
            />
          </div>

          {/* Social Row */}
          <div className="relative z-10 flex items-center gap-2 pt-1">
            <span className="text-xs text-stone-400 mr-2">Follow:</span>
            <a
              href="https://www.instagram.com/teenzos"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F72585] text-white flex items-center justify-center transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com/@teenzos"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#FF0000] text-white flex items-center justify-center transition-colors"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Right Column: Interactive Send Message Form */}
        <div className="lg:col-span-7 bg-white rounded-[5px] p-6 sm:p-8 border border-stone-200/90 shadow-xs">
          <div className="mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#F72585]">
              Quick Inquiry
            </span>
            <h3 className="font-display font-[350] text-2xl sm:text-3xl text-[#0B0D0E] uppercase mt-1">
              Send Us A Message
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              Fill in your details and our team will get back to you within 24 hours.
            </p>
          </div>

          {success ? (
            <div className="bg-[#E9F9EE] border border-[#27B43E]/30 rounded-2xl p-6 sm:p-8 text-center space-y-3 animate-fade-in">
              <div className="w-14 h-14 bg-[#27B43E] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-display font-bold text-xl text-[#0B0D0E]">
                Message Delivered!
              </h4>
              <p className="text-stone-600 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out. We have received your inquiry and our support team will reply shortly.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#27B43E] hover:underline"
              >
                Send another message →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="first-name" className="text-xs font-bold uppercase tracking-wider text-[#0B0D0E]">
                    First Name <span className="text-[#F72585]">*</span>
                  </label>
                  <input
                    id="first-name"
                    name="first-name"
                    type="text"
                    required
                    placeholder="Rohit"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-stone-200 text-xs sm:text-sm text-[#0B0D0E] placeholder:text-stone-400 focus:outline-none focus:border-[#F72585] focus:ring-1 focus:ring-[#F72585] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="last-name" className="text-xs font-bold uppercase tracking-wider text-[#0B0D0E]">
                    Last Name <span className="text-[#F72585]">*</span>
                  </label>
                  <input
                    id="last-name"
                    name="last-name"
                    type="text"
                    required
                    placeholder="Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-stone-200 text-xs sm:text-sm text-[#0B0D0E] placeholder:text-stone-400 focus:outline-none focus:border-[#F72585] focus:ring-1 focus:ring-[#F72585] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#0B0D0E]">
                    Email Address <span className="text-[#F72585]">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="rohit@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-stone-200 text-xs sm:text-sm text-[#0B0D0E] placeholder:text-stone-400 focus:outline-none focus:border-[#F72585] focus:ring-1 focus:ring-[#F72585] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-[#0B0D0E]">
                    Phone Number <span className="text-stone-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-stone-200 text-xs sm:text-sm text-[#0B0D0E] placeholder:text-stone-400 focus:outline-none focus:border-[#F72585] focus:ring-1 focus:ring-[#F72585] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-[#0B0D0E]">
                  Your Message <span className="text-[#F72585]">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  placeholder="Tell us about sizing, bulk inquiry, or order details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-stone-200 text-xs sm:text-sm text-[#0B0D0E] placeholder:text-stone-400 focus:outline-none focus:border-[#F72585] focus:ring-1 focus:ring-[#F72585] transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[5px] bg-[#0B0D0E] hover:bg-[#F72585] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── FAQ Section (Compact Accordion) ── */}
      <div className="bg-white rounded-[5px] p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-4">
        <div className="text-center max-w-lg mx-auto mb-6">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F72585]">
            Got Questions?
          </span>
          <h3 className="font-display font-[350] text-2xl sm:text-3xl text-[#0B0D0E] uppercase mt-1">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {displayedFaqs.map((faq) => (
            <details
              key={faq.id}
              className="group bg-[#F7F7F6] rounded-[5px] border border-stone-200/80 overflow-hidden transition-colors"
            >
              <summary className="font-display font-[350] text-sm sm:text-base text-[#0B0D0E] px-5 py-4 cursor-pointer flex justify-between items-center outline-none list-none select-none hover:text-[#F72585] transition-colors">
                <span>{faq.question}</span>
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 ml-3 transition-transform group-open:rotate-180 group-open:bg-[#FFE1ED] group-open:text-[#F72585] text-stone-500 shadow-2xs">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </summary>
              <div className="px-5 pb-4 text-stone-600 text-xs sm:text-[13px] leading-relaxed border-t border-stone-200/60 pt-3">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}