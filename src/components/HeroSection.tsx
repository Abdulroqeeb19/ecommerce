"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useCurrency } from "@/store/currency";
import { CURRENCY_RATES } from "@/lib/utils";
import { SLOGAN, MOTTO } from "@/lib/brand";
import { cx } from "@/lib/utils";

interface HeroItem {
  id: string;
  name: string;
  brand: string;
  spec: string;
  category: string;
  image: string;
  save: number;
}

const HERO_ITEMS: HeroItem[] = [
  { id: "hl_pot", name: "POT", brand: "Rivo", spec: "Stainless Steel Cookware", category: "Kitchen Utensils", image: "/images/catalog/pot.png", save: 18 },
  { id: "hl_blender", name: "BLENDER", brand: "Binatone", spec: "500W High-Speed Blending", category: "Kitchen Utensils", image: "/images/catalog/blender.png", save: 25 },
  { id: "hl_cooler", name: "COOLER", brand: "Thermos", spec: "Insulated Food Cooler", category: "Kitchen Utensils", image: "/images/catalog/cooler.png", save: 15 },
  { id: "hl_singlet", name: "SINGLET", brand: "TinyTots", spec: "100% Soft Cotton", category: "Babies Wears", image: "/images/catalog/singlet.png", save: 20 },
  { id: "hl_shoe", name: "SHOES", brand: "Adorable", spec: "Soft-Sole Baby Footwear", category: "Babies Wears", image: "/images/catalog/shoe.png", save: 16 },
  { id: "hl_bag", name: "BAG", brand: "Cuddles", spec: "Spacious diaper & baby bag", category: "Babies Wears", image: "/images/catalog/bag.png", save: 22 },
  { id: "hl_sockets", name: "SOCKETS", brand: "Legrand", spec: "13A Flat-Face Wall Sockets", category: "Electrical", image: "/images/catalog/sockets.png", save: 12 },
  { id: "hl_solar", name: "SOLAR KIT", brand: "Solardown", spec: "Panel & Backup Lighting", category: "Electrical", image: "/images/catalog/solar.png", save: 30 }
];

export function HeroSection() {
  const { currency } = useCurrency();
  const rate = CURRENCY_RATES[currency.code] ?? 1;
  const free = Math.round(500 * rate);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % HERO_ITEMS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const item = HERO_ITEMS[index];

  return (
    <section className="relative overflow-hidden rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #182230 0%, #0C121A 100%)" }}>
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="absolute right-40 bottom-0 h-64 w-64 rounded-full bg-gold-400/5 blur-3xl" />
      <div className="relative grid lg:grid-cols-2 gap-8 p-8 sm:p-12 lg:p-14">
        <div className="relative z-10 flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 border border-gold-400/40 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase mb-5">
            <Sparkles className="h-4 w-4 text-gold-300" /> Now Stocking
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight">
            Kitchen Utensils, Babies Wears and Electrical Fittings
          </h1>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-gold-200">
            {SLOGAN}
          </p>
          <p className="mt-4 text-slate-300 max-w-md text-sm sm:text-base italic">
            &quot;{MOTTO}.&quot;
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-navy-900 font-bold shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gold-gradient)" }}
            >
              SHOP NOW <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/school"
              className="inline-flex items-center gap-2 rounded-lg border border-gold-400/40 hover:bg-gold-400/10 font-semibold px-6 py-3.5 text-sm transition-colors"
            >
              Mini-Store for Schools
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-green" /> Quality Products
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-300" /> Affordable Prices
            </span>
            <span className="flex items-center gap-2 text-brand-green font-medium">Free delivery on orders over {currency.symbol}{fmt(free)}</span>
          </div>
        </div>

        {/* Auto-changing sub-item showcase */}
        <div className="relative hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 scale-110 rounded-full bg-gold-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20">
              <div className="relative aspect-square bg-slate-100">
                {HERO_ITEMS.map((it, i) => (
                  <Image
                    key={it.id}
                    src={it.image}
                    alt={it.name}
                    width={460}
                    height={460}
                    className={cx(
                      "absolute inset-0 h-full w-full object-contain p-6 transition-opacity duration-700",
                      i === index ? "opacity-100" : "opacity-0"
                    )}
                  />
                ))}
              </div>
              <div className="px-5 py-4 text-navy-900">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-extrabold text-lg">{item.brand} {item.name}</p>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase bg-skyline-100 text-skyline-700">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{item.spec} · Now Stocking</p>
              </div>
              <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
                {HERO_ITEMS.map((it, i) => (
                  <button
                    key={it.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${it.name}`}
                    className={cx("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-gold-400" : "w-1.5 bg-navy-200 hover:bg-navy-300")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hot Deal bar — below the entire banner */}
      <div className="relative border-t border-white/10 bg-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-8 sm:px-12 lg:px-14 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg px-3 py-2 text-navy-900 font-bold text-xs uppercase tracking-wide" style={{ background: "var(--gold-gradient)" }}>
              Hot Deal
            </span>
            <div>
              <p className="font-display font-extrabold text-lg text-gold-200">{item.brand} {item.name}</p>
              <p className="text-xs text-slate-400">{item.spec} · {item.category} · Now Stocking</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300">Save up to</span>
            <span className="font-display font-extrabold text-2xl" style={{ color: "var(--gold-light)" }}>{currency.symbol}{fmt(item.save * rate)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}