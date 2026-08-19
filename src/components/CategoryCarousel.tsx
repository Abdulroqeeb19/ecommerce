"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Laptop,
  Printer,
  Monitor,
  BatteryCharging,
  Utensils,
  Plug,
  Baby,
  Package,
  ArrowRight,
  type LucideIcon
} from "lucide-react";
import { DEFAULT_CATEGORY_CARDS } from "@/lib/brand";
import { CATEGORY_CARD_IDS } from "@/lib/catalogCategories";
import { api } from "@/lib/api";
import type { CategoryCard } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  laptop: Laptop,
  printer: Printer,
  monitor: Monitor,
  battery: BatteryCharging,
  utensils: Utensils,
  plug: Plug,
  baby: Baby
};

const ACTIVE_CATEGORY_IDS = CATEGORY_CARD_IDS;

const byOrder = (a: { id: string }, b: { id: string }) =>
  ACTIVE_CATEGORY_IDS.indexOf(a.id) - ACTIVE_CATEGORY_IDS.indexOf(b.id);

export function CategoryCarousel() {
  const [cards, setCards] = useState<CategoryCard[]>(
    DEFAULT_CATEGORY_CARDS.filter((c) => ACTIVE_CATEGORY_IDS.includes(c.id)).sort(byOrder)
  );

  useEffect(() => {
    let cancelled = false;
    api
      .get<CategoryCard[]>("/category-cards")
      .then((list) => {
        if (!cancelled && Array.isArray(list) && list.length)
          setCards(list.filter((c) => c.active && ACTIVE_CATEGORY_IDS.includes(c.id)).sort(byOrder));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-14">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slateink dark:text-white">
          Shop by <span className="text-primary-600">Category</span>
        </h2>
        <Link href="/shop" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((item, i) => {
          const Icon = ICONS[item.icon] || Package;
          return (
            <Link
              key={item.id || item.name}
              href={item.href}
              data-cursor="Shop"
              className="cinem-card-in cinem-card-glow group relative overflow-hidden rounded-xl bg-gradient-to-br from-slateink to-primary-900 text-white shadow-card hover:shadow-hover transition-all hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 90}ms` }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
              }}
            >
              <Image
                src={item.image}
                alt={item.name}
                width={300}
                height={220}
                className="h-44 w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slateink via-slateink/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gold-500" />
                  <span className="font-display font-extrabold text-sm tracking-wide">{item.name}</span>
                </span>
                <p className="text-xs text-slate-300 mt-0.5">{item.tagline}</p>
              </div>
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-0 transition-all duration-700 ease-out" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}