"use client";

import Link from "next/link";
import { Phone, Mail, Facebook, Twitter, Instagram, User, Sun, Moon } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useCurrency } from "@/store/currency";
import { useTheme } from "@/store/theme";

const SOCIALS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" }
];

export function TopBar() {
  const { user } = useAuth();
  const { currency, currencies, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <a href="mailto:support@gadgetstore.com" className="hidden sm:flex items-center gap-1.5 hover:text-primary-700">
            <Mail className="h-3.5 w-3.5" /> support@gadgetstore.com
          </a>
          <a href="tel:+2348000000000" className="flex items-center gap-1.5 hover:text-primary-700">
            <Phone className="h-3.5 w-3.5" /> +234 800 000 0000
          </a>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label} className="text-slate-500 dark:text-slate-400 hover:text-primary-700">
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-slate-400 dark:text-slate-500">Currency:</span>
            <select
              value={currency.code}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-slate-600 dark:text-slate-300 font-semibold outline-none cursor-pointer"
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
            className="p-1 rounded-md text-slate-500 dark:text-slate-300 hover:text-primary-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <Link
            href="/account"
            className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-700"
          >
            <User className="h-3.5 w-3.5" />
            {user ? user.name.split(" ")[0] : "Login / Account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
