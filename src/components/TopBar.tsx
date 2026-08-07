"use client";

import Link from "next/link";
import { Phone, Mail, Facebook, Instagram, MessageCircle, User, Sun, Moon } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useCurrency } from "@/store/currency";
import { useTheme } from "@/store/theme";
import { BRAND_EMAIL, BRAND_PHONES, FACEBOOK_URL, INSTAGRAM_URL, whatsappLink } from "@/lib/brand";

const SOCIALS = [
  { icon: Facebook, href: FACEBOOK_URL, label: "Facebook" },
  { icon: Instagram, href: INSTAGRAM_URL, label: "Instagram" },
  { icon: MessageCircle, href: whatsappLink("Hello AYINDEDUNNY ENTERPRISE, I have an enquiry."), label: "WhatsApp" }
];

export function TopBar() {
  const { user } = useAuth();
  const { currency, currencies, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-navy-950 text-slate-400 text-xs border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <a href={`mailto:${BRAND_EMAIL}`} className="hidden sm:flex items-center gap-1.5 hover:text-gold-300">
            <Mail className="h-3.5 w-3.5" /> {BRAND_EMAIL}
          </a>
          <a href={`tel:+2348033004595`} className="flex items-center gap-1.5 hover:text-gold-300">
            <Phone className="h-3.5 w-3.5" /> {BRAND_PHONES[0]}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label} className="text-slate-400 hover:text-gold-300">
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-slate-500">Currency:</span>
            <select
              value={currency.code}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-slate-300 font-semibold outline-none cursor-pointer"
              aria-label="Select currency"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="text-slate-800">
                  {c.code} {c.symbol}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1 rounded-md text-slate-400 hover:text-gold-300 hover:bg-white/10 transition-colors"
            aria-label="Toggle dark mode"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <Link
            href="/account"
            className="flex items-center gap-1.5 font-semibold text-slate-300 hover:text-gold-300"
          >
            <User className="h-3.5 w-3.5" />
            {user ? user.name.split(" ")[0] : "Login / Account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
