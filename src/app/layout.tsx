import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/store/providers";
import { ChromeShell } from "@/components/ChromeShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AYINDEDUNNY ENTERPRISE — Babies Wears, Electrical Materials and Home Essentials",
    template: "%s | AYINDEDUNNY ENTERPRISE"
  },
  description:
    "Offline-first PWA e-commerce for Babies Wears, Electrical Materials and Fittings, and Home Essentials. Includes a mini-store for schools.",
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
          <ChromeShell>{children}</ChromeShell>
        </AppProviders>
      </body>
    </html>
  );
}
