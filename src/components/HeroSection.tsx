"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Star } from "lucide-react";
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
  callouts: { label: string; tone: string }[];
}

const HERO_ITEMS: HeroItem[] = [
  {
    id: "hl_pot",
    name: "POT",
    brand: "Rivo",
    spec: "Stainless Steel Cookware",
    category: "Kitchen Utensils",
    image: "/images/catalog/pot.png",
    save: 18,
    callouts: [
      { label: "Stainless Steel", tone: "gold" },
      { label: "Induction Ready", tone: "sky" }
    ]
  },
  {
    id: "hl_blender",
    name: "BLENDER",
    brand: "Binatone",
    spec: "500W High-Speed Blending",
    category: "Kitchen Utensils",
    image: "/images/catalog/blender.png",
    save: 25,
    callouts: [
      { label: "500W Motor", tone: "gold" },
      { label: "4 Speeds", tone: "sky" }
    ]
  },
  {
    id: "hl_cooler",
    name: "COOLER",
    brand: "Thermos",
    spec: "Insulated Food Cooler",
    category: "Kitchen Utensils",
    image: "/images/catalog/cooler.png",
    save: 15,
    callouts: [
      { label: "12H Cold", tone: "sky" },
      { label: "Food Safe", tone: "gold" }
    ]
  },
  {
    id: "hl_singlet",
    name: "SINGLET",
    brand: "TinyTots",
    spec: "100% Soft Cotton",
    category: "Babies Wears",
    image: "/images/catalog/singlet.png",
    save: 20,
    callouts: [
      { label: "100% Cotton", tone: "gold" },
      { label: "Baby Safe", tone: "sky" }
    ]
  },
  {
    id: "hl_shoe",
    name: "SHOES",
    brand: "Adorable",
    spec: "Soft-Sole Baby Footwear",
    category: "Babies Wears",
    image: "/images/catalog/shoe.png",
    save: 16,
    callouts: [
      { label: "Soft Sole", tone: "sky" },
      { label: "Flex Fit", tone: "gold" }
    ]
  },
  {
    id: "hl_bag",
    name: "BAG",
    brand: "Cuddles",
    spec: "Spacious diaper & baby bag",
    category: "Babies Wears",
    image: "/images/catalog/bag.png",
    save: 22,
    callouts: [
      { label: "Spacious", tone: "gold" },
      { label: "Multi-Pocket", tone: "sky" }
    ]
  },
  {
    id: "hl_sockets",
    name: "SOCKETS",
    brand: "Legrand",
    spec: "13A Flat-Face Wall Sockets",
    category: "Electrical",
    image: "/images/catalog/sockets.png",
    save: 12,
    callouts: [
      { label: "13A Rated", tone: "gold" },
      { label: "Flat Face", tone: "sky" }
    ]
  },
  {
    id: "hl_solar",
    name: "SOLAR KIT",
    brand: "Solardown",
    spec: "Panel & Backup Lighting",
    category: "Electrical",
    image: "/images/catalog/solar.png",
    save: 30,
    callouts: [
      { label: "Sun Powered", tone: "gold" },
      { label: "Night Light", tone: "sky" }
    ]
  }
];

const CALLOUT_TONES: Record<string, string> = {
  gold: "border-gold-400/60 text-gold-200 bg-gold-400/10 shadow-[0_0_18px_rgba(212,175,55,0.35)]",
  sky: "border-sky-400/60 text-sky-200 bg-sky-400/10 shadow-[0_0_18px_rgba(56,189,248,0.35)]"
};

interface DustSpec {
  left: string;
  size: number;
  duration: number;
  delay: number;
}

function DustField() {
  const dust = useMemo<DustSpec[]>(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: `${(i * 4.6 + 3) % 100}%`,
        size: 2 + ((i * 7) % 4),
        duration: 7 + ((i * 13) % 9),
        delay: (i * 0.55) % 9
      })),
    []
  );
  return (
    <div className="cinem-dust-field" aria-hidden="true">
      {dust.map((d, i) => (
        <span
          key={i}
          className="cinem-dust"
          style={{
            left: d.left,
            width: d.size,
            height: d.size,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`
          }}
        />
      ))}
    </div>
  );
}

export function HeroSection() {
  const { currency } = useCurrency();
  const rate = CURRENCY_RATES[currency.code] ?? 1;
  const free = Math.round(500 * rate);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = requestAnimationFrame(() => setMounted(true));
    const timer = setInterval(() => setIndex((i) => (i + 1) % HERO_ITEMS.length), 4200);
    return () => {
      cancelAnimationFrame(id);
      clearInterval(timer);
    };
  }, []);

  const item = HERO_ITEMS[index];

  return (
    <section
      className="relative overflow-hidden rounded-2xl text-white"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(212,175,55,0.18) 0%, transparent 55%), linear-gradient(135deg, #182230 0%, #0C121A 100%)"
      }}
    >
      {/* Volumetric spotlight beams */}
      <div className="cinem-beam left-[8%] rotate-[18deg]" aria-hidden="true" />
      <div className="cinem-beam right-[6%] -rotate-[16deg]" aria-hidden="true" />
      <div className="cinem-beam left-[42%] rotate-[8deg] hidden lg:block" aria-hidden="true" />

      <DustField />

      {/* Ambient glow blobs */}
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl cinem-glow-pulse" />
      <div className="absolute right-40 bottom-0 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl cinem-glow-pulse" style={{ animationDelay: "1.6s" }} />

      <div className="relative grid lg:grid-cols-2 gap-8 p-8 sm:p-12 lg:p-14">
        {/* Copy column — cinematic staggered entrance */}
        <div className="relative z-10 flex flex-col justify-center">
          <span className="cinem-reveal cinem-reveal-fade-up is-inview inline-flex w-fit items-center gap-2 rounded-full bg-white/10 border border-gold-400/40 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase mb-5 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-gold-300" /> Now Stocking
          </span>
          <h1 className="cinem-reveal cinem-reveal-fade-up is-inview font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight">
            Kitchen Utensils, Babies Wears and Electrical Fittings
          </h1>
          <p className="cinem-reveal cinem-reveal-fade-up is-inview mt-2 font-display text-2xl sm:text-3xl font-bold">
            <span className="cinem-shimmer-text">{SLOGAN}</span>
          </p>
          <p className="cinem-reveal cinem-reveal-fade-up is-inview mt-4 text-slate-300 max-w-md text-sm sm:text-base italic">
            &quot;{MOTTO}.&quot;
          </p>
          <div className="cinem-reveal cinem-reveal-fade-up is-inview mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-navy-900 font-bold shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gold-gradient)", boxShadow: "0 4px 24px rgba(212,175,55,0.45)" }}
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
          <div className="cinem-reveal cinem-reveal-fade-up is-inview mt-8 flex flex-wrap gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-green" /> Quality Products
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-300" /> Affordable Prices
            </span>
            <span className="flex items-center gap-2 text-brand-green font-medium">Free delivery on orders over {currency.symbol}{fmt(free)}</span>
          </div>
        </div>

        {/* Product showcase — cinematic reveal stage */}
        <div className="relative hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-md">
            {/* Orbital rings */}
            <div className="cinem-orbital-ring" style={{ ["--ring-size" as string]: "clamp(320px, 46vw, 460px)" }} aria-hidden="true">
              <span className="cinem-orbital-dot" />
            </div>
            <div className="cinem-orbital-ring cinem-spin-slow-reverse" style={{ ["--ring-size" as string]: "clamp(280px, 40vw, 400px)", borderColor: "rgba(56,189,248,0.25)" }} aria-hidden="true">
              <span className="cinem-orbital-dot" style={{ background: "#38bdf8", boxShadow: "0 0 14px 3px rgba(56,189,248,0.7)" }} />
            </div>

            {/* Glow behind product */}
            <div className="absolute inset-0 scale-110 rounded-full bg-gold-400/10 blur-2xl cinem-glow-pulse" />

            {/* Floating product card */}
            <div
              className={cx(
                "cinem-reveal relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20",
                mounted ? "cinem-reveal-zoom is-inview" : "cinem-reveal-zoom",
                "cinem-float"
              )}
            >
              <div className="relative aspect-square bg-slate-100 cinem-sheen-wrap">
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

            {/* Feature callout badges — floating UI callouts */}
            <div className="cinem-callout absolute -left-4 top-6 z-20 hidden sm:block" style={{ animationDelay: "0.9s" }}>
              <Callout label={item.callouts[0]?.label || item.spec} tone={item.callouts[0]?.tone || "gold"} />
            </div>
            <div className="cinem-callout absolute -right-3 top-1/4 z-20 hidden sm:block" style={{ animationDelay: "1.3s" }}>
              <Callout label={item.callouts[1]?.label || "Best Price"} tone={item.callouts[1]?.tone || "sky"} />
            </div>
            <div className="cinem-callout absolute -left-6 bottom-16 z-20 hidden sm:flex items-center gap-2 rounded-xl border border-gold-400/50 bg-navy-900/70 backdrop-blur px-3 py-2 text-xs font-bold text-gold-200 shadow-[0_0_22px_rgba(212,175,55,0.35)]" style={{ animationDelay: "1.7s" }}>
              <Star className="h-4 w-4 fill-gold-300 text-gold-300" /> Save up to {currency.symbol}{fmt(item.save * rate)}
            </div>
          </div>
        </div>
      </div>

      {/* Hot Deal bar — below the entire banner */}
      <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
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

function Callout({ label, tone }: { label: string; tone: string }) {
  return (
    <div className={cx("rounded-xl border px-3 py-2 text-xs font-bold backdrop-blur-md", CALLOUT_TONES[tone] || CALLOUT_TONES.gold)}>
      {label}
    </div>
  );
}
