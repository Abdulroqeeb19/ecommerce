import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FBF7E9",
          100: "#F6EDC9",
          200: "#F1D27D",
          300: "#E8C954",
          400: "#DDBB3E",
          500: "#E6B800",
          600: "#D4AF37",
          700: "#A67C1E",
          800: "#8A6518",
          900: "#6B4A12",
          950: "#4C3410"
        },
        skyline: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0EA5E9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e"
        },
        amber: {
          400: "#fbbf24",
          500: "#F59E0B",
          600: "#d97706"
        },
        gold: {
          50: "#FBF7E9",
          100: "#F6EDC9",
          200: "#F1D27D",
          300: "#E4C359",
          400: "#D4AF37",
          500: "#C19B2A",
          600: "#A67C1E",
          700: "#8A6518",
          800: "#6B4A12",
          900: "#4C3410"
        },
        navy: {
          700: "#1D2835",
          800: "#182230",
          900: "#121A24",
          950: "#0C121A"
        },
        brand: {
          red: "#E63946",
          green: "#2EC4B6",
          muted: "#E0E0E0"
        },
        slatebg: "#F8F9FA",
        slateink: "#121A24"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.06)",
        hover: "0 8px 30px rgba(37,99,235,0.16)"
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        marquee: "marquee 30s linear infinite"
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } }
      }
    }
  },
  plugins: []
};

export default config;
