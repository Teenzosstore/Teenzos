"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Reveal from "./Reveal";
import { useCart } from "@/context/CartContext";

interface Product {
  id: string;
  name: string;
  category_id: string;
  image_url: string;
  badge?: string;
  rating?: number;
  price: number;
  oldPrice?: number;
  colorCount?: number;
  colors?: { name: string; hex: string }[];
}

interface Category {
  id: string;
  name: string;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function handleProductImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = "/image.png";
}

export default function Products({
  products = [],
  categories = [],
  title = "Fresh from the drop",
  subtitle = "A curated edit from our latest collection — message us on WhatsApp for sizing, fabric notes or a custom piece."
}: {
  products?: Product[],
  categories?: Category[],
  title?: string,
  subtitle?: string
}) {
  const { addToCart } = useCart();
  const router = useRouter();

  return (
    <section id="products" className="relative py-12 md:py-16 bg-[#E4E0DD]">
      <div className="max-w-wrap mx-auto px-5 md:px-8">
        <Reveal className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[13px] md:text-sm font-bold tracking-[0.25em] uppercase text-[#8A6A26]">
            <span className="h-px w-8 bg-[#D2A546]" />
            Featured Pieces
            <span className="h-px w-8 bg-[#D2A546]" />
          </div>
          <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl text-[#0B0C0B] uppercase tracking-wide">
            {title}
          </h2>
          <p className="mt-4 text-[#5A5550] font-body text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            {subtitle}
          </p>
        </Reveal>

        <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6">
          {products.slice(0, 10).map((p, i) => {
            const categoryName = categories.find(c => c.id === p.category_id)?.name || p.category_id || "Uncategorized";
            return (
              <Reveal key={p.id} delay={(i % 5) as any} className="flex-none w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)]">
                <Link href={`/shop/${p.id}`} className="block">
                  <div className="lift group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-lg border border-[#E6DAC4] h-full flex flex-col">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#F0EAE0]">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        onError={handleProductImageError}
                        className="absolute inset-0 h-full w-full object-fill"
                      />
                      {p.badge && (
                        <span className="absolute top-3 left-3 bg-[#D2A546] text-[#080909] text-[9px] md:text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-sm">
                          {p.badge}
                        </span>
                      )}
                      <span className="absolute bottom-3 right-3 bg-[#1E1B17] text-[#E4E0DD] text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded shadow-sm">
                        {categoryName}
                      </span>
                    </div>
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-[#1A1A1A] text-[13px] md:text-[15px] leading-snug line-clamp-2 hover:text-[#B9893F] transition-colors">
                          {p.name}
                        </h3>
                      {p.colors && p.colors.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {p.colors.slice(0, 5).map((colorObj) => (
                            <span
                              key={colorObj.name}
                              title={colorObj.name}
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-sm"
                              style={{ backgroundColor: colorObj.hex }}
                            />
                          ))}
                          {p.colors.length > 5 && (
                            <span className="text-[10px] text-[#8A857E] font-medium">
                              +{p.colors.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        p.colorCount && p.colorCount > 1 && (
                          <p className="mt-1 text-[11px] font-semibold text-[#B9893F]">
                            {p.colorCount} colors available
                          </p>
                        )
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-display font-bold text-[#0B0C0B] text-[14px] md:text-base">
                        {formatINR(p.price)}
                      </span>
                      {p.oldPrice && (
                        <span className="text-[#9A958D] text-[12px] line-through">
                          {formatINR(p.oldPrice)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image_url: p.image_url,
                            category_name: categoryName
                          });
                        }}
                        className="w-full text-center rounded-lg border border-[#0C0E0D]/40 text-[#0C0E0D] text-[13px] md:text-sm font-bold py-2.5 hover:bg-[#0C0E0D] hover:border-[#0C0E0D] hover:text-[#F2EFEA] transition-colors flex items-center justify-center"
                      >
                        Add to cart
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image_url: p.image_url,
                            category_name: categoryName
                          });
                          router.push('/checkout');
                        }}
                        className="w-full text-center rounded-lg bg-[#0C0E0D] text-[#F2EFEA] text-[13px] md:text-sm font-bold py-2.5 hover:bg-[#2A2D2B] transition-colors flex items-center justify-center shadow-sm"
                      >
                        Buy now
                      </button>
                    </div>
                  </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#0C0E0D] text-[#F2EFEA] font-body font-semibold text-[15px] tracking-wide shadow-card hover:bg-[#2A2D2B] transition-colors"
          >
            View Full Catalogue
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
