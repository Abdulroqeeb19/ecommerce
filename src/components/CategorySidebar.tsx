"use client";

import Link from "next/link";
import { Menu, Baby, Plug, Utensils, ChevronRight } from "lucide-react";

const SIDEBAR_CATEGORIES = [
  { name: "Babies Wears", icon: Baby },
  { name: "Electrical Materials and Fittings", icon: Plug },
  { name: "Home Essentials", icon: Utensils }
];

export function CategorySidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <button className="w-full rounded-t-xl px-5 py-4 flex items-center justify-between font-bold text-sm text-slateink" style={{ background: "var(--gold-gradient)" }}>
        <span className="flex items-center gap-2.5">
          <Menu className="h-5 w-5" /> All Categories
        </span>
        <ChevronRight className="h-4 w-4" />
      </button>
      <ul className="bg-white dark:bg-navy-800 border border-t-0 border-slate-200 dark:border-navy-700 rounded-b-xl shadow-sm divide-y divide-slate-100 dark:divide-navy-700 overflow-hidden">
        {SIDEBAR_CATEGORIES.map(({ name, icon: Icon }) => (
          <li key={name}>
            <Link
              href={`/shop?category=${encodeURIComponent(name)}`}
              className="flex items-center justify-between px-5 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-700 dark:hover:text-primary-400 hover:pl-6 transition-all"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                {name}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
