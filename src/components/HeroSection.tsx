"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useCurrency } from "@/store/currency";
import { CURRENCY_RATES } from "@/lib/utils";
import { SLOGAN, MOTTO } from "@/lib/brand";
import { useProducts } from "@/lib/catalog";
import { cx } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface HeroItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  spec: string;
  category: string;
  image: string;
  price: number;
  save: number;
  callouts: { label: string; tone: string }[];
}

/** Display order for the main shop categories (Babies, then Electrical, then Home Essentials). */
const CATEGORY_ORDER = ["Babies Wears", "Electrical Materials and Fittings", "Home Essentials"];

/** Fallback showcase used only while there are no products in the local catalog. */
const FALLBACK_HERO_ITEMS: HeroItem[] = [
  {
    id: "hl_pot",
    slug: "",
    name: "POT",
    brand: "Rivo",
    spec: "Stainless Steel Cookware",
    category: "Home Essentials",
    image: "/images/catalog/pot.png",
    price: 4500,
    save: 18,
    callouts: [
      { label: "Stainless Steel", tone: "gold" },
      { label: "Induction Ready", tone: "sky" }
    ]
  },
  {
    id: "hl_singlet",
    slug: "",
    name: "SINGLET",
    brand: "TinyTots",
    spec: "100% Soft Cotton",
    category: "Babies Wears",
    image: "/images/catalog/singlet.png",
    price: 3000,
    save: 20,
    callouts: [
      { label: "100% Cotton", tone: "gold" },
      { label: "Baby Safe", tone: "sky" }
    ]
  },
  {
    id: "hl_sockets",
    slug: "",
    name: "SOCKETS",
    brand: "Tops",
    spec: "Surface-Mount Power Sockets",
    category: "Electrical Materials and Fittings",
    image: "/images/catalog/sockets.png",
    price: 2500,
    save: 15,
    callouts: [
      { label: "Fire Safe", tone: "gold" },
      { label: "2-3 Pin", tone: "sky" }
    ]
  }
];

function toHeroItem(p: Product): HeroItem {
  const save = p.oldPrice && p.oldPrice > p.price ? p.oldPrice - p.price : 0;
  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);
  const spec = p.shortDescription || p.group || p.category;
  const first = p.specs?.[0]?.value || p.specs?.[0]?.label;
  const second = p.specs?.[1]?.value || p.specs?.[1]?.label;
  return {
    id: p.id,
    slug: p.slug,
    name: clip(p.title, 24),
    brand: p.brand,
    spec: clip(spec, 34),
    category: p.category,
    image: p.image,
    price: p.price,
    save,
    callouts: [
      { label: clip(first || p.brand || "Top Quality", 18), tone: "gold" },
      { label: clip(second || "Now Stocking", 18), tone: "sky" }
    ]
  };
}

const CALLOUT_TONES: Record<string, string> = {
  gold: "border-gold-400/60 text-gold-200 bg-black shadow-[0_0_18px_rgba(212,175,55,0.45)]",
  sky: "border-sky-400/60 text-sky-200 bg-black shadow-[0_0_18px_rgba(56,189,248,0.45)]"
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
  const { products } = useProducts();
  const rate = CURRENCY_RATES[currency.code] ?? 1;
  const free = Math.round(500 * rate);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

  // Live slides: featured products first (admin-controlled "Hot Deal"), filled
  // with an in-stock mix across Babies -> Electrical -> Home Essentials so the showcase
  // stays populated and always shows the latest uploaded product images.
  const heroItems = useMemo<HeroItem[]>(() => {
    const eligible = (products || []).filter((p) => !p.miniStore && p.image && p.stock > 0);
    if (eligible.length === 0) return FALLBACK_HERO_ITEMS;
    const featured = eligible.filter((p) => p.featured);
    const pool = featured.length >= 3 ? featured : eligible;
    const picks: Product[] = [];
    const seen = new Set<string>();
    for (const cat of CATEGORY_ORDER) {
      for (const p of pool.filter((x) => x.category === cat && !seen.has(x.id)).slice(0, 2)) {
        picks.push(p);
        seen.add(p.id);
      }
    }
    for (const p of pool) {
      if (picks.length >= 8) break;
      if (!seen.has(p.id)) {
        picks.push(p);
        seen.add(p.id);
      }
    }
    return picks.slice(0, 8).map(toHeroItem);
  }, [products]);

  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || heroItems.length === 0) return;
    const id = requestAnimationFrame(() => setMounted(true));
    const timer = setInterval(() => setIndex((i) => (i + 1) % heroItems.length), 4200);
    return () => {
      cancelAnimationFrame(id);
      clearInterval(timer);
    };
  }, [heroItems.length]);

  const safeIndex = index < heroItems.length ? index : Math.max(0, heroItems.length - 1);
  const item = heroItems[safeIndex] || heroItems[0];
  const saveAmt = Math.round(item.save * rate);
  const itemLabel = [item.brand, item.name].filter(Boolean).join(" ");
  const deal =
    saveAmt > 0
      ? { prefix: "Save up to", value: `${currency.symbol}${fmt(saveAmt)}` }
      : item.price > 0
        ? { prefix: "From", value: `${currency.symbol}${fmt(Math.round(item.price * rate))}+` }
        : null;

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
            Home Essentials, Babies Wears and Electrical Fittings
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
        <div className="relative hidden md:flex items-center justify-center">
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
                {heroItems.map((it, i) => (
                  <Image
                    key={it.id}
                    src={it.image}
                    alt={it.name}
                    width={460}
                    height={460}
                    className={cx(
                      "absolute inset-0 h-full w-full object-contain p-6 transition-opacity duration-700",
                      i === safeIndex ? "opacity-100" : "opacity-0"
                    )}
                  />
                ))}
              </div>
              <div className="px-5 py-4 text-navy-900">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-extrabold text-lg">{itemLabel}</p>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase bg-skyline-100 text-skyline-700">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{item.spec} · Now Stocking</p>
              </div>
              <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
                {heroItems.map((it, i) => (
                  <button
                    key={it.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${it.name}`}
                    className={cx("h-1.5 rounded-full transition-all", i === safeIndex ? "w-6 bg-gold-400" : "w-1.5 bg-navy-200 hover:bg-navy-300")}
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
              {saveAmt > 0 ? (
                <>
                  <Star className="h-4 w-4 fill-gold-300 text-gold-300" /> Save up to {currency.symbol}{fmt(saveAmt)}
                </>
              ) : (
                <span className="text-brand-green">Best Price · In Stock</span>
              )}
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
              {item.slug ? (
                <Link href={`/product/${item.slug}`} className="font-display font-extrabold text-lg text-gold-200 hover:underline">
                  {itemLabel}
                </Link>
              ) : (
                <p className="font-display font-extrabold text-lg text-gold-200">{itemLabel}</p>
              )}
              <p className="text-xs text-slate-400">{item.spec} · {item.category} · Now Stocking</p>
            </div>
          </div>
          {deal && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300">{deal.prefix}</span>
              <span className="font-display font-extrabold text-2xl" style={{ color: "var(--gold-light)" }}>
                {deal.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Callout({ label, tone }: { label: string; tone: string }) {
  return (
    <div className={cx("rounded-xl border px-3 py-2 text-xs font-bold", CALLOUT_TONES[tone] || CALLOUT_TONES.gold)}>
      {label}
    </div>
  );
}
