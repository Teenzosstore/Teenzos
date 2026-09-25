export const SITE = {
  name: "Teenzosstore",
  tagline: "Wear your vibe.",
  email: "teenzosstore@gmail.com",
  phone: "+91 78629 07344",
  phoneHref: "+917862907344",
  secondaryPhone: "+91 76220 78703",
  secondaryPhoneHref: "+917622078703",
  proprietor: "Nabil Patni Vahora",
  whatsapp: "917862907344",
  whatsappMessage: "Hi TeenZos! I'd like to know more about your collection.",
  city: "Ahmedabad, Gujarat, India",
  address: "First Floor B/123, Sohelpark, Fatehwadi, Gyaspur, Ahmedabad - 382405",
  instagram: "teenzosstore",
  facebook: "teenzosstore",
};

export type Category = {
  id: string;
  name: string;
  description: string;
  image: string;
  count: string;
};

export const categories: Category[] = [
  {
    id: "new-drops",
    name: "New Drops",
    description: "Fresh silhouettes hitting the racks every week — cop before they're gone.",
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/New%20drops/ChatGPT%20Image%20Aug%203%2C%202026%2C%2001_49_56%20AM.png",
    count: "24 styles",
  },
  {
    id: "best-sellers",
    name: "Best Sellers",
    description: "The pieces everyone's repping. Restocked weekly, sold out fast.",
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Best%20sellers/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2001_59_39%20PM.png",
    count: "18 styles",
  },
  {
    id: "oversized-tees",
    name: "Oversized Tees",
    description: "Heavyweight cotton tees with boxy fits and bold graphic prints.",
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Street%20wear%20collection/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2001_36_54%20PM.png",
    count: "32 styles",
  },
  {
    id: "acid-wash",
    name: "Acid Wash",
    description: "Distressed, faded and one-of-one — every wash job is unique.",
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Acid%20wash/ChatGPT%20Image%20Jul%2022%2C%202026%2C%2012_47_17%20AM.png",
    count: "12 styles",
  },
  {
    id: "gym-collection",
    name: "Gym Collection",
    description: "Moisture-wicking comfort for the grind. Built to move, styled to flex.",
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Gym%20Collection/ChatGPT%20Image%20Jul%2022%2C%202026%2C%2010_12_54%20PM.png",
    count: "16 styles",
  },
  {
    id: "streetwear-collection",
    name: "Streetwear Collection",
    description: "The core drop — hoodies, cargo, jackets and the fits that define the culture.",
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Street%20wear%20collection/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2001_36_54%20PM.png",
    count: "28 styles",
  },
  {
    id: "limited-edition",
    name: "Limited Edition",
    description: "Numbered runs that never restock. When it's gone, it's gone.",
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Limited%20Edition/ChatGPT%20Image%20Aug%203%2C%202026%2C%2001_20_31%20AM.png",
    count: "8 styles",
  },
];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: string;
  rating: number;
};

export const products: Product[] = [
  {
    id: "p1",
    name: "TeenZos Heavyweight Oversized Tee — Black",
    category: "Oversized Tees",
    price: 1299,
    oldPrice: 1599,
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Street%20wear%20collection/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2001_36_54%20PM.png",
    badge: "Bestseller",
    rating: 4.9,
  },
  {
    id: "p2",
    name: "Acid Wash Distressed Tee — Washed Grey",
    category: "Acid Wash",
    price: 1499,
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Acid%20wash/ChatGPT%20Image%20Jul%2022%2C%202026%2C%2012_47_17%20AM.png",
    badge: "New",
    rating: 4.8,
  },
  {
    id: "p3",
    name: "FlexFit Gym Training Tee — Neon Detail",
    category: "Gym Collection",
    price: 999,
    oldPrice: 1299,
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Gym%20Collection/IMG-20260818-WA0012.jpg",
    badge: "Hot",
    rating: 4.7,
  },
  {
    id: "p4",
    name: "Limited Edition Logo Hoodie — Numbered Drop",
    category: "Limited Edition",
    price: 2499,
    oldPrice: 2999,
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Limited%20Edition/ChatGPT%20Image%20Aug%203%2C%202026%2C%2001_20_31%20AM.png",
    badge: "Limited",
    rating: 4.9,
  },
  {
    id: "p5",
    name: "Street Cargo Pants — Olive",
    category: "Streetwear Collection",
    price: 1799,
    oldPrice: 2199,
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Street%20wear%20collection/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2002_10_00%20PM.png",
    rating: 4.6,
  },
  {
    id: "p6",
    name: "Graphic Oversized Tee — 'FLEX' Print",
    category: "Oversized Tees",
    price: 1399,
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Street%20wear%20collection/ChatGPT%20Image%20Aug%2018%2C%202026%2C%2001_40_26%20PM.png",
    badge: "New Drop",
    rating: 4.8,
  },
  {
    id: "p7",
    name: "Acid Wash Denim Jacket — Faded Blue",
    category: "Acid Wash",
    price: 2799,
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Acid%20wash/ChatGPT%20Image%20Jul%2022%2C%202026%2C%2012_48_59%20AM.png",
    rating: 4.5,
  },
  {
    id: "p8",
    name: "Athleisure Joggers — Tech Fabric",
    category: "Gym Collection",
    price: 1599,
    image: "https://bwudwdyzqkvpbymheybq.supabase.co/storage/v1/object/public/rawflex/categories/Gym%20Collection/IMG-20260818-WA0015.jpg",
    badge: "Popular",
    rating: 4.7,
  },
];

export type Testimonial = {
  name: string;
  city: string;
  quote: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Rohan S.",
    city: "Ahmedabad",
    quote:
      "The oversized tee fit was spot on. Heavy fabric, clean print — you can tell the quality the moment you touch it.",
    initials: "RS",
  },
  {
    name: "Aditya V.",
    city: "Lucknow",
    quote:
      "Copped the acid wash hoodie and it's genuinely one-of-one. Every wash turns heads. Teenzosstore doesn't miss.",
    initials: "AV",
  },
  {
    name: "Ishaan M.",
    city: "Delhi",
    quote:
      "Messaged them on WhatsApp at night and got a reply in minutes. Delivery was fast and the fit guide was clutch.",
    initials: "IM",
  },
  {
    name: "Karan T.",
    city: "Bengaluru",
    quote:
      "Gym collection is underrated. Wicks sweat better than brands charging double. Already copped two more tees.",
    initials: "KT",
  },
];

export const usps = [
  {
    title: "Heavyweight Fabric",
    description: "240 GSM cotton and tech blends built for daily wear, washes and the streets — not for a single season.",
  },
  {
    title: "One-Of-One Finishes",
    description: "Acid washes and distressed prints that make every single piece genuinely unique.",
  },
  {
    title: "Fit That Flexes",
    description: "Oversized, boxy and athlete-tested silhouettes engineered to look right on every build.",
  },
  {
    title: "Pan-India Shipping",
    description: "Dispatched from Ahmedabad with tracked delivery across India, plus easy size exchanges.",
  },
];

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Men", href: "/shop?category=men" },
  { label: "Women", href: "/shop?category=women" },
  { label: "New Arrivals", href: "/shop?category=new-arrivals" },
  { label: "Collections", href: "/shop" },
  { label: "About Us", href: "/about" },
];
