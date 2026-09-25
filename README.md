# RAWFLEX

A Next.js (App Router) storefront for **RAWFLEX**, a streetwear brand — built
with TypeScript and Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build for production:

```bash
npm run build
npm run start
```

## Project structure

```
app/
  layout.tsx      → fonts, global metadata
  page.tsx         → assembles the homepage sections
  globals.css      → design tokens, scroll-reveal, dividers, gradients
  shop/            → product listing + product detail pages
  checkout/        → checkout flow
  admin/           → admin dashboard (products, orders, settings)
  profile/         → customer account pages
components/
  Header.tsx       → sticky nav + mobile menu
  Hero.tsx         → homepage hero (background + model cutout + product cards)
  Categories.tsx   → shop-by-category card grid
  NewDrops.tsx     → new-arrivals product grid
  CartDrawer.tsx   → slide-out cart
  Footer.tsx       → footer with nav + contact recap
lib/
  data.ts          → static copy/nav/fallback content
  db.json          → mock backend data (products, categories, orders) used by
                     lib/supabase/server.ts when no real Supabase project is
                     configured
public/
  products/, categories/ → product and category imagery
```

## Editing content

Static copy (nav links, fallback categories) lives in **`lib/data.ts`**.
Product, category and order data served through the mock backend lives in
**`lib/db.json`** — edit it directly, or manage it through `/admin` once
signed in.

## Design tokens

Colors, fonts and animation timing are centralized in `tailwind.config.js`
under `theme.extend`.

## Deploying

This is a standard Next.js app — it deploys as-is to Vercel, Netlify, or any
Node host. Run `npm run build` then `npm run start`, or connect the repo to
your hosting provider of choice.
