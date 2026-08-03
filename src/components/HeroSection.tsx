"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Cpu, BatteryCharging, ShieldCheck } from "lucide-react";
import { useCurrency } from "@/store/currency";
import { getActiveCurrency, CURRENCY_RATES } from "@/lib/utils";

export function HeroSection() {
  const { currency } = useCurrency();
  const rate = CURRENCY_RATES[currency.code] ?? 1;
  const free = Math.round(500 * rate);
  const save = Math.round(200 * rate);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slateink via-primary-900 to-primary-600 text-white">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-skyline-500/20 blur-3xl" />
      <div className="absolute right-40 bottom-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative grid lg:grid-cols-2 gap-8 p-8 sm:p-12 lg:p-14">
        <div className="relative z-10 flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase mb-5">
            <Cpu className="h-4 w-4 text-skyline-400" /> New 2026 Collection Arriving
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight">
            Next-Gen Office and Tech Gear
          </h1>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-skyline-400">
            Power Your Productivity
          </p>
          <p className="mt-4 text-slate-300 max-w-md text-sm sm:text-base">
            From business ultrabooks to smart desk setups — explore a curated range of electronics and office gadgets engineered for modern work and study.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold px-7 py-3.5 shadow-lg shadow-primary-900/40 transition-colors"
            >
              SHOP NOW <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/school"
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 hover:bg-white/10 font-semibold px-6 py-3.5 text-sm transition-colors"
            >
              School Mini-Store
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> 1-Year Warranty
            </span>
            <span className="flex items-center gap-2">
              <BatteryCharging className="h-4 w-4 text-amber-400" /> Power and Backup Gear
            </span>
            <span className="flex items-center gap-2 text-emerald-300 font-medium">Free delivery on orders over {currency.symbol}{fmt(free)}</span>
          </div>
        </div>
        <div className="relative hidden lg:flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 scale-110 rounded-full bg-skyline-500/20 blur-2xl" />
            <Image
              src="/images/products/ultrabook-x15.svg"
              alt="Premium business laptop"
              width={460}
              height={460}
              className="relative rounded-2xl shadow-2xl ring-1 ring-white/20"
            />
          </div>
          <div className="absolute left-2 top-10 rounded-xl bg-white/95 px-4 py-3 text-slateink shadow-xl animate-fade-in">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Up to</p>
            <p className="font-display font-extrabold text-xl text-primary-700">16GB RAM</p>
            <p className="text-[10px] text-slate-500">512GB SSD Ultrabooks</p>
          </div>
          <div className="absolute right-0 bottom-14 rounded-xl bg-amber-500 px-4 py-3 text-slateink shadow-xl animate-fade-in">
            <p className="text-[10px] uppercase tracking-wide font-semibold">Hot Deal</p>
            <p className="font-display font-extrabold text-xl">Save up to {currency.symbol}{fmt(save)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
