import Link from "next/link";
import { GraduationCap, Truck, ShieldCheck, HeadphonesIcon, ArrowRight, CalendarDays } from "lucide-react";
import { CategorySidebar } from "@/components/CategorySidebar";
import { SearchBar } from "@/components/SearchBar";
import { HeroSection } from "@/components/HeroSection";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Perks } from "@/components/Perks";
import { InStockTicker } from "@/components/InStockTicker";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-[16rem_1fr] gap-8">
        <CategorySidebar />
        <div className="min-w-0">
          <SearchBar />
          <div className="mt-6">
            <HeroSection />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-2">
        <Perks />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InStockTicker />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CategoryCarousel />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FeaturedProducts />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mt-14 rounded-2xl bg-gradient-to-r from-primary-700 to-skyline-600 text-white overflow-hidden relative">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative p-8 sm:p-10 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <GraduationCap className="h-4 w-4" /> For Boarding Schools
              </span>
              <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold">School Mini-Store for JSS1, JSS2 and JSS3</h2>
              <p className="mt-2 text-slate-200 max-w-xl text-sm">
                Designated ordering days: Monday (JSS1), Tuesday (JSS2), Wednesday (JSS3). Restricted to three authorized managers with full offline operation.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/school" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-primary-700 font-bold px-6 py-3 text-sm hover:bg-slate-100">
                Open Mini-Store <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/school#manager-login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 hover:bg-white/10 font-semibold px-6 py-3 text-sm">
                Manager Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
