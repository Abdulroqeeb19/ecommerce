"use client";

import { GraduationCap, Truck, ShieldCheck, HeadphonesIcon, CalendarDays } from "lucide-react";
import { useCurrency } from "@/store/currency";
import { CURRENCY_RATES } from "@/lib/utils";

const PERKS = [
  { icon: Truck, title: "Fast Delivery", key: "shipping" },
  { icon: ShieldCheck, title: "1-Year Warranty", key: "warranty" },
  { icon: HeadphonesIcon, title: "24/7 Support", key: "support" },
  { icon: CalendarDays, title: "School Mini-Store", key: "school" }
];

export function Perks() {
  const { currency } = useCurrency();
  const rate = CURRENCY_RATES[currency.code] ?? 1;
  const free = Math.round(500 * rate);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

  const descs: Record<string, string> = {
    shipping: `Free shipping on orders over ${currency.symbol}${fmt(free)}`,
    warranty: "Certified genuine electronics",
    support: "Call or email us any time",
    school: "Ordering days for JSS1–JSS3"
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {PERKS.map(({ icon: Icon, title, key }) => (
        <div key={key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3 shadow-card">
          <div className="rounded-lg bg-primary-50 dark:bg-primary-900/40 p-2.5">
            <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-white">{title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{descs[key]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
