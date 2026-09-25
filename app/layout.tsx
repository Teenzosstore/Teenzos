import type { Metadata } from "next";
import { Poppins, Anton, Permanent_Marker } from "next/font/google";

import "./globals.css";

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import FloatingActionButtons from "@/components/FloatingActionButtons";
import Script from "next/script";

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
      <head>
        {/* Facebook Pixel */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;
            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];
            t=b.createElement(e);
            t.async=!0;
            t.src=v;
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
            }(
              window,
              document,
              'script',
              'https://connect.facebook.net/en_US/fbevents.js'
            );

            fbq('init', '1052580883980327');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>

      <body
        className="font-body bg-white text-ink antialiased"
        suppressHydrationWarning
      >
        {/* Facebook Pixel NoScript */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1052580883980327&ev=PageView&noscript=1"
            alt="facebook pixel noscript"
          />
        </noscript>

        <ToastProvider>
          <CartProvider>
            {children}
            <FloatingActionButtons />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
