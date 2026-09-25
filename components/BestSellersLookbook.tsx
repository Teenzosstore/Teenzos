"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Star } from "lucide-react";
import { cloudinaryLoaderFor } from "@/lib/cloudinaryImage";

const BASE = "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex";

const bestSellers = [
  {
    name: "Urbanic Box Tee",
    price: 999,
    reviews: 120,
    image: `${BASE}/categories/Street%20wear%20collection/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2001_36_54%20PM.png`,
  },
  {
    name: "Mindset Tee",
    price: 1099,
    reviews: 98,
    image: `${BASE}/categories/Street%20wear%20collection/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2001_40_26%20PM.png`,
  },
  {
    name: "Washed Black Tee",
    price: 1099,
    reviews: 101,
    image: `${BASE}/categories/Acid%20wash/ChatGPT%20Image%20Jul%2022%2C%202026%2C%2012_47_17%20AM.png`,
  },
  {
    name: "Butterfly Tee",
    price: 1199,
    reviews: 90,
    image: `${BASE}/categories/Limited%20Edition/ChatGPT%20Image%20Aug%203%2C%202026%2C%2001_20_31%20AM.png`,
  },
  {
    name: "Eternal Tee",
    price: 1199,
    reviews: 99,
    image: `${BASE}/categories/Gym%20Collection/IMG-20260818-WA0012.jpg`,
  },
  {
    name: "Discipline Tee",
    price: 1199,
    reviews: 105,
    image: `${BASE}/categories/Street%20wear%20collection/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2002_10_00%20PM.png`,
  },
];

const lookbook = [
  { id: "default-lookbook-1", image_url: `${BASE}/lookbook/lookbook-1.jpg`, link_url: "/shop" },
  { id: "default-lookbook-2", image_url: `${BASE}/lookbook/lookbook-2.jpg`, link_url: "/shop" },
  { id: "default-lookbook-3", image_url: `${BASE}/lookbook/lookbook-3.jpg`, link_url: "/shop" },
  { id: "default-lookbook-4", image_url: `${BASE}/lookbook/lookbook-4.jpg`, link_url: "/shop" },
  { id: "default-lookbook-5", image_url: `${BASE}/lookbook/lookbook-5.jpg`, link_url: "/shop" },
];

function formatINR(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

function SectionTitle({
  title,
  href,
  label,
}: {
  title: string;
  href: string;
  label: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-5">
      <h2 className="font-display text-3xl font-black uppercase leading-none text-white md:text-4xl">
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-2 text-[11px] font-black uppercase text-[#D4A82C] transition-all hover:gap-3 md:text-sm"
      >
        {label}
        <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
      </Link>
    </div>
  );
}

function Rating({ reviews }: { reviews: number }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="flex items-center gap-0.5 text-[#D4A82C]">
        {[0, 1, 2, 3, 4].map((star) => (
          <Star key={star} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <span className="text-[12px] font-bold text-white/70">({reviews})</span>
    </div>
  );
}

type LookbookImage = {
  id: string;
  image_url: string;
  link_url: string | null;
};

function LookbookCard({
  item,
  index,
}: {
  item: LookbookImage;
  index: number;
}) {
  const href = item.link_url?.trim();
  const shopHref = "/shop";

  return (
    <div className="group relative min-w-0">
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={item.image_url}
          alt={`RAWFLEX lookbook style ${index + 1}`}
          fill
          loader={cloudinaryLoaderFor(item.image_url)}
          sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 20vw"
          className="object-cover object-center"
        />
      </div>
      <Link
        href={shopHref}
        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#D4A82C]/60 bg-[#0a0909]/80 text-[#D4A82C] hover:bg-[#D4A82C] hover:text-[#0a0909] transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function BestSellersLookbook({
  products = [],
  categoryId,
  lookbookImages,
}: {
  products?: any[];
  categoryId?: string;
  lookbookImages?: LookbookImage[];
}) {
  const router = useRouter();
  const items =
    products.length > 0
      ? products.map((p: any) => ({
          name: p.name,
          price:
            p.sale_price && p.sale_price < p.price ? p.sale_price : p.price,
          reviews: p.review_count || 24,
          image: p.image_url,
          slug: p.slug,
        }))
      : bestSellers;
  const lookbookItems = lookbookImages === undefined ? lookbook : lookbookImages;
  const bestSellersHref = categoryId ? `/shop?category=${categoryId}` : '/shop?featured=true';

  return (
    <section className="relative bg-[#0a0909] pb-12 pt-6 md:pb-16 md:pt-8">
      <div className="max-w-wrap mx-auto px-5 md:px-8">
        <SectionTitle title="Best Sellers" href={bestSellersHref} label="View All" />

        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const productHref = item.slug ? `/shop/${item.slug}` : "/shop";
              return (
                <div
                  key={item.slug || item.name + index}
                  className="group block min-w-0 relative cursor-pointer"
                  onClick={() => router.push(productHref)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden border border-white/10 bg-[#f1efeb] hover:border-[#D4A82C]/50 transition-colors">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      loader={cloudinaryLoaderFor(item.image)}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  {isLast && (
                    <Link
                      href={bestSellersHref}
                      aria-label="View best sellers"
                      className="absolute right-[-20px] top-[calc(50%-4rem)] hidden h-10 w-10 items-center justify-center rounded-full border border-[#D4A82C]/60 bg-[#0a0909]/90 text-[#D4A82C] shadow-[0_0_0_3px_rgba(0,0,0,0.7)] transition-colors hover:bg-[#D4A82C] hover:text-[#0a0909] lg:flex z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  )}
                  <div className="pt-3 sm:pt-4">
                    <h3 className="line-clamp-1 text-[12px] sm:text-[13px] font-black uppercase leading-none text-white/70 transition-colors group-hover:text-[#D4A82C] md:text-[15px]">
                      {item.name}
                    </h3>
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-black text-white md:text-base">
                      {formatINR(item.price)}
                    </p>
                    <Rating reviews={item.reviews} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {lookbookItems.length > 0 ? (
          <div className="mt-10 md:mt-12 lg:mt-14">
            <SectionTitle title="Lookbook" href="/shop" label="View All Looks" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {lookbookItems.slice(0, 5).map((item, index) => (
                <LookbookCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
