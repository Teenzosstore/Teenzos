import Reveal from "./Reveal";
import BotanicalDivider from "./BotanicalDivider";
import { IconFabric, IconNeedle, IconTulip, IconWing } from "./Icons";
import { usps } from "@/lib/data";

const icons = [IconFabric, IconNeedle, IconTulip, IconWing];

const cardColors = [
  {
    iconBg: "bg-gold/15 group-hover:bg-gold/25",
    iconColor: "text-gold-light",
    borderColor: "group-hover:border-gold/50",
    shadowColor: "hover:shadow-[0_20px_40px_rgba(199,183,158,0.10)]"
  },
  {
    iconBg: "bg-rose-soft/10 group-hover:bg-rose-soft/20",
    iconColor: "text-rose-soft",
    borderColor: "group-hover:border-rose-soft/45",
    shadowColor: "hover:shadow-[0_20px_40px_rgba(226,185,168,0.08)]"
  },
  {
    iconBg: "bg-amber-300/10 group-hover:bg-amber-300/20",
    iconColor: "text-amber-300",
    borderColor: "group-hover:border-amber-300/45",
    shadowColor: "hover:shadow-[0_20px_40px_rgba(245,158,11,0.10)]"
  },
  {
    iconBg: "bg-emerald/10 group-hover:bg-emerald/20",
    iconColor: "text-emerald-soft",
    borderColor: "group-hover:border-emerald/45",
    shadowColor: "hover:shadow-[0_20px_40px_rgba(154,149,141,0.08)]"
  }
];

export default function WhyUs() {
  return (
    <section className="relative py-12 md:py-16 bg-gradient-to-br from-[#101211] via-[#0B0D0C] to-[#080909] overflow-hidden">
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-cream-deep/60 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-0 w-[360px] h-[360px] rounded-full bg-gold/5 blur-3xl" />

      <div className="max-w-wrap mx-auto px-5 md:px-8 relative">
        <Reveal className="text-center max-w-xl mx-auto">
          <div className="eyebrow justify-center inline-flex items-center gap-2 !text-ink/80">
            <span className="h-px w-6 bg-ink/20" />
            Why Teenzosstore
            <span className="h-px w-6 bg-ink/20" />
          </div>
          <h2 className="section-heading mt-4 !text-gold-light">
            Built with the same care, every time.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
          {usps.map((item, i) => {
            const Icon = icons[i % icons.length];
            const colors = cardColors[i % cardColors.length];
            return (
              <Reveal key={item.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <div className={`h-full bg-panel border border-cream-line rounded-2xl md:rounded-[24px] p-5 md:p-7 backdrop-blur-sm transition-all duration-300 hover:bg-panel2 hover:-translate-y-2 group ${colors.borderColor} ${colors.shadowColor}`}>
                  <div className={`h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${colors.iconBg}`}>
                    <Icon className={`w-6 h-6 md:w-7 md:h-7 transition-colors ${colors.iconColor}`} />
                  </div>
                  <h3 className="font-display font-bold text-ink text-base md:text-lg mt-5 uppercase tracking-wide transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-ink/60 text-[13px] md:text-sm mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
      <div className="relative mt-12">
        <BotanicalDivider tone="gold" />
      </div>
    </section>
  );
}