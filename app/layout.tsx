import type { Metadata } from "next";
import { Poppins, Anton, Permanent_Marker } from "next/font/google";

import "./globals.css";

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import CartFlyOverlay from "@/components/CartFlyOverlay";
import PageTransitionLoader from "@/components/PageTransitionLoader";
import FloatingActionButtons from "@/components/FloatingActionButtons";

// ==========================================
// FONTS
// ==========================================

// Body Font
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Streetwear Heading Font
const anton = Anton({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
  display: "swap",
});

// Handwritten / Graffiti Style Font
const marker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-marker",
  weight: ["400"],
  display: "swap",
});

// ==========================================
// METADATA
// ==========================================

export const metadata: Metadata = {
  title: "TeenZos | Streetwear Built Different",

  description:
    "TeenZos — premium streetwear built for the bold. Explore oversized tees, graphic tees, streetwear drops and new arrivals.",

  keywords: [
    "TeenZos",
    "TeenZos streetwear",
    "streetwear",
    "oversized tees",
    "graphic tees",
    "streetwear India",
    "fashion",
    "oversized clothing",
    "new streetwear drops",
  ],

  icons: {
    icon: "/TeenZos_Favicon_48x48.ico",
    shortcut: "/TeenZos_Favicon_48x48.ico",
    apple: "/TeenZos_Favicon_48x48.ico",
  },

  openGraph: {
    title: "TeenZos | Streetwear Built Different",

    description:
      "Premium oversized tees, graphic designs and streetwear drops built for the bold.",

    type: "website",
  },
};

// ==========================================
// ROOT LAYOUT
// ==========================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${anton.variable} ${marker.variable}`}
    >
      <body
        className="font-body bg-white text-ink antialiased"
        suppressHydrationWarning
      >

        <ToastProvider>
          <CartProvider>
            {children}
            <PageTransitionLoader />
            <CartFlyOverlay />
            <FloatingActionButtons />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
