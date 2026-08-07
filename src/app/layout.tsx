import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/store/providers";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AYINDEDUNNY ENTERPRISE — Babies Wears, Electrical Materials and Kitchen",
    template: "%s | AYINDEDUNNY ENTERPRISE"
  },
  description:
    "Offline-first PWA e-commerce for Babies Wears, Electrical Materials and Fittings, and Kitchen Utensils. Includes a mini-store for schools.",
  manifest: "/manifest.json",
  applicationName: "AYINDEDUNNY ENTERPRISE",
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
    <html lang="en" className="font-sans">
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
