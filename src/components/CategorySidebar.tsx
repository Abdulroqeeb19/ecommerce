"use client";

import Link from "next/link";
import { Menu, Laptop, Smartphone, Printer, Armchair, Headphones, Monitor, Network, BatteryCharging, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/types";

const ICONS = [Laptop, Smartphone, Printer, Armchair, Headphones, Monitor, Network, BatteryCharging];

export function CategorySidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <button className="w-full bg-primary-700 hover:bg-primary-600 text-white rounded-t-xl px-5 py-4 flex items-center justify-between font-bold text-sm">
        <span className="flex items-center gap-2.5">
          <Menu className="h-5 w-5" /> All Categories
        </span>
        <ChevronRight className="h-4 w-4" />
      </button>
      <ul className="bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-800 rounded-b-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {CATEGORIES.map((cat, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <li key={cat}>
              <Link
                href={`/shop?category=${encodeURIComponent(cat)}`}
                className="flex items-center justify-between px-5 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-700 dark:hover:text-primary-400 hover:pl-6 transition-all"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {cat}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
