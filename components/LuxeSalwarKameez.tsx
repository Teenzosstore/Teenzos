"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Reveal from "./Reveal";
import { useCart } from "@/context/CartContext";

interface Product {
  id: string;
  name: string;
  image_url: string;
  badge?: string;
  rating?: number;
  price: number;
  oldPrice?: number;
  colorCount?: number;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function handleProductImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = "/image.png";
}

export default function LuxeSalwarKameez({ products = [] }: { products?: Product[] }) {
  const { addToCart } = useCart();
  const router = useRouter();

  if (products.length === 0) return null;

  return (
    <section className="relative py-12 md:py-16 bg-cream">
      <div className="max-w-wrap mx-auto px-5 md:px-8">
        <Reveal className="text-center max-w-xl mx-auto">
          <div className="eyebrow justify-center inline-flex items-center gap-2">
            <span className="h-px w-6 bg-gold" />
            New Arrival
            <span className="h-px w-6 bg-gold" />
          </div>
          <h2 className="section-heading mt-4">
            The <span className="italic text-emerald font-medium">Oversized</span> Tee Edit
          </h2>
          <p className="section-sub mt-4">
            Heavyweight cotton, boxy fits and washes that hit different — a
            curated edit for the daily flex.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6">
          {products.slice(0, 10).map((p, i) => (
            <Reveal key={p.id} delay={(i % 5) as any} className="flex-none w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)]">
              <div className="lift group bg-panel rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-cream-line/80 h-full flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-cream-deep/20">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    onError={handleProductImageError}
                    className="absolute inset-0 h-full w-full object-fill"
                  />
                  {p.badge && (
                    <span className="absolute top-3 left-3 bg-emerald text-cream text-[9px] md:text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-sm">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <div className="flex-1">
                    <Link href={`/shop/${p.id}`} className="hover:text-emerald transition-colors">
                      <h3 className="font-display font-semibold text-ink text-[13px] md:text-[15px] leading-snug line-clamp-2">
                        {p.name}
                      </h3>
                    </Link>
                    {p.colorCount && p.colorCount > 1 && (
                      <p className="mt-1 text-[11px] font-semibold text-emerald">
                        {p.colorCount} colors available
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-display font-bold text-ink text-[14px] md:text-base">
                      {formatINR(p.price)}
                    </span>
                    {p.oldPrice && (
                      <span className="text-ink/40 text-[12px] line-through">
                        {formatINR(p.oldPrice)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      onClick={() =>
                        addToCart({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          image_url: p.image_url,
                          category_name: "Oversized Tees",
                        })
                      }
                      className="w-full text-center rounded-lg border border-emerald/50 text-emerald text-[13px] md:text-sm font-bold py-2.5 hover:bg-emerald hover:border-emerald hover:text-cream transition-colors flex items-center justify-center"
                    >
                      Add to cart
                    </button>
                    <button
                      onClick={() => {
                        addToCart({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          image_url: p.image_url,
                          category_name: "Oversized Tees",
                        });
                        router.push("/checkout");
                      }}
                      className="w-full text-center rounded-lg bg-emerald text-cream text-[13px] md:text-sm font-bold py-2.5 hover:bg-emerald-deep hover:text-emerald transition-colors flex items-center justify-center shadow-sm"
                    >
                      Buy now
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 text-center">
          <Link
            href="/shop?category=oversized-tees"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gold text-black font-body font-semibold text-[15px] tracking-wide shadow-card hover:bg-gold-light transition-colors"
          >
            Shop The Oversized Edit
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
