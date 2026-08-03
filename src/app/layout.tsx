import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/store/providers";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Gadget Hub — Electronics and Office Gadgets Store",
    template: "%s | Gadget Hub"
  },
  description:
    "Offline-first PWA e-commerce for electronics and office gadgets: laptops, printers, smart desk tech, power and backup. Includes a boarding school mini-store.",
  manifest: "/manifest.json",
  applicationName: "Gadget Hub",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("gh-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`
          }}
        />
      </head>
      <body>
        <AppProviders>
          <div className="min-h-screen flex flex-col">
            <TopBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CompareTray />
          <PwaRegister />
        </AppProviders>
      </body>
    </html>
  );
}
