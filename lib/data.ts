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
    id: "men",
    name: "Men",
    description: "Oversized & boxy streetwear fits engineered for maximum comfort and style.",
    image: "/images/explore/img_01.png",
    count: "12 styles",
  },
  {
    id: "women",
    name: "Women",
    description: "Relaxed streetwear silhouettes, crop graphics, and bold aesthetics.",
    image: "/images/explore/img_04.png",
    count: "8 styles",
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    description: "Fresh drops hitting the racks every week — cop before they sell out.",
    image: "/images/explore/img_04.png",
    count: "16 styles",
  },
  {
    id: "bestseller",
    name: "Hot Bestseller",
    description: "The most wanted streetwear pieces everyone's repping. Restocked weekly.",
    image: "/images/explore/img_01.png",
    count: "14 styles",
  },
  {
    id: "trending",
    name: "Trending",
    description: "Viral fits and hyped silhouettes setting the streetwear culture wave.",
    image: "/images/explore/img_02.png",
    count: "10 styles",
  },
  {
    id: "exclusive",
    name: "Exclusive",
    description: "Numbered limited runs and 1-of-1 drops that never restock.",
    image: "/images/explore/img_03.png",
    count: "6 styles",
  },
  {
    id: "hoodies",
    name: "Hoodies",
    description: "Heavyweight 400+ GSM fleece and graffiti streetwear hoodies.",
    image: "/images/explore/img_01.png",
    count: "18 styles",
  },
  {
    id: "t-shirts",
    name: "T-Shirts",
    description: "Heavyweight 240 GSM boxy oversized graphic tees built for everyday flex.",
    image: "/images/explore/img_02.png",
    count: "24 styles",
  },
  {
    id: "sweatshirts",
    name: "Sweatshirts",
    description: "Clean crewnecks and heavyweight graphic pullovers for cozy fits.",
    image: "/images/explore/img_03.png",
    count: "8 styles",
  },
  {
    id: "jackets",
    name: "Jackets",
    description: "Denim, utility bombers, and distressed outerwear for the streets.",
    image: "/images/explore/img_04.png",
    count: "6 styles",
  },
  {
    id: "bottoms",
    name: "Bottoms",
    description: "Relaxed street cargo pants, tech joggers, and distressed denim.",
    image: "/images/explore/img_02.png",
    count: "10 styles",
  },
  {
    id: "accessories",
    name: "Accessories",
    description: "Streetwear caps, beanies, socks, and custom hardware accessories.",
    image: "/images/explore/img_03.png",
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

export const products: Product[] = [];

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
