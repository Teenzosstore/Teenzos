import Reveal from "./Reveal";
import BotanicalDivider from "./BotanicalDivider";
import { testimonials } from "@/lib/data";

export default function Testimonials() {
  return (
    <section id="reviews" className="relative py-12 md:py-16 bg-cream">
      <div className="max-w-wrap mx-auto px-5 md:px-8">
        <Reveal className="text-center max-w-xl mx-auto">
          <div className="eyebrow justify-center inline-flex items-center gap-2">
            <span className="h-px w-6 bg-gold" />
            Customer Love
            <span className="h-px w-6 bg-gold" />
          </div>
          <h2 className="section-heading mt-4">Words from the flexers</h2>
        </Reveal>

        <div className="mt-12 flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-5 md:gap-6 pb-6 w-full">
          {testimonials.map((t, i) => (
            <Reveal
              key={t.name}
              delay={(i % 4) as 0 | 1 | 2 | 3}
              className="w-[290px] md:w-[340px] shrink-0 snap-start snap-always"
            >
              <div className="h-full bg-cream-deep/50 border border-cream-line rounded-2xl md:rounded-[24px] p-6 flex flex-col hover:border-gold/30 hover:bg-cream-deep/75 transition-all duration-300">
                <span className="text-gold text-2xl leading-none">★★★★★</span>
                <p className="text-ink/75 text-[14px] leading-relaxed mt-4 flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald text-cream flex items-center justify-center font-display font-semibold text-sm shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">{t.name}</p>
                    <p className="text-ink/50 text-xs">{t.city}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <BotanicalDivider />
    </section>
  );
}
