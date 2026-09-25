const items = [
  "Heavyweight Fabric",
  "One-of-One Washes",
  "Pan-India Shipping",
  "Easy Size Exchange",
  "Limited Drops",
  "Made With Care in Ahmedabad",
];

export default function TrustMarquee() {
  const loopItems = [...items, ...items];
  return (
    <div className="marquee-row relative border-y border-cream-line bg-emerald-deep py-6 md:py-8 overflow-hidden">
      <div className="marquee-track gap-10">
        {loopItems.map((item, i) => (
          <div key={i} className="flex items-center gap-10 shrink-0">
            <span className="font-display font-semibold text-gold-light text-sm md:text-base tracking-wide whitespace-nowrap">
              {item}
            </span>
            <span className="text-gold/60 text-base">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}