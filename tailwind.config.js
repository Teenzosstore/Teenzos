/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        // =========================
        // TEENZOS BRAND COLORS
        // =========================

        black: "#0B0D0E",
        dark: "#121619",
        charcoal: "#1A1E20",

        white: "#F7F7F5",
        offwhite: "#F1F1EF",
        light: "#E8E8E6",

        pink: {
          DEFAULT: "#F72585",
          light: "#FF4D9A",
          dark: "#D91668",
          soft: "#FFE1ED",
        },

        cyan: {
          DEFAULT: "#36B8C5",
          light: "#65D0D9",
          dark: "#218D98",
          soft: "#DDF6F8",
        },

        orange: {
          DEFAULT: "#F47B20",
          light: "#FF9A4D",
          dark: "#D85E0B",
          soft: "#FFF0E3",
        },

        // Useful semantic colors
        brand: "#F72585",
        accent: "#36B8C5",
        highlight: "#F47B20",

        // Product / card colors
        card: "#FFFFFF",
        cardDark: "#171B1D",
        border: "#DCDCDC",
        borderDark: "#292D2F",

        // Text
        ink: "#111315",
        muted: "#6B7073",
        mutedDark: "#A7ACAE",
      },

      fontFamily: {
        display: ["var(--font-display)", "Anton", "Impact", "sans-serif"],

        body: ["var(--font-body)", "Poppins", "sans-serif"],

        marker: ["var(--font-marker)", "Permanent Marker", "cursive"],

        sans: ["var(--font-body)", "Poppins", "sans-serif"],
      },

      maxWidth: {
        wrap: "1400px",
      },

      boxShadow: {
        soft: "0 20px 50px -20px rgba(0, 0, 0, 0.25)",
        card: "0 14px 34px -16px rgba(0, 0, 0, 0.20)",
        pink: "0 10px 30px -10px rgba(247, 37, 133, 0.45)",
        cyan: "0 10px 30px -10px rgba(54, 184, 197, 0.35)",
      },

      keyframes: {
        fadeUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(28px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        drawLine: {
          "0%": {
            strokeDashoffset: "1400",
          },
          "100%": {
            strokeDashoffset: "0",
          },
        },

        floatSlow: {
          "0%,100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-14px)",
          },
        },

        shimmer: {
          "0%": {
            backgroundPosition: "0% 50%",
          },
          "100%": {
            backgroundPosition: "100% 50%",
          },
        },

        marquee: {
          "0%": {
            transform: "translateX(0)",
          },
          "100%": {
            transform: "translateX(-50%)",
          },
        },

        pulsePink: {
          "0%,100%": {
            boxShadow: "0 0 0 0 rgba(247,37,133,0.35)",
          },
          "50%": {
            boxShadow: "0 0 0 12px rgba(247,37,133,0)",
          },
        },

        bounceArrow: {
          "0%,100%": {
            transform: "translateX(0)",
          },
          "50%": {
            transform: "translateX(5px)",
          },
        },
      },

      animation: {
        fadeUp: "fadeUp 0.9s cubic-bezier(.22,1,.36,1) forwards",
        drawLine: "drawLine 2.6s cubic-bezier(.22,1,.36,1) forwards",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        shimmer: "shimmer 6s ease-in-out infinite alternate",
        marquee: "marquee 30s linear infinite",
        pulsePink: "pulsePink 2s infinite",
        bounceArrow: "bounceArrow 1.5s ease-in-out infinite",
      },
    },
  },

  plugins: [],
};
