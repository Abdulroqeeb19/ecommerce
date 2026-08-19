"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";import { Heart, ShoppingCart, Menu, X, ChevronDown } from "lucide-react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useAuth } from "@/store/auth";
import { formatPrice } from "@/lib/utils";
import { SHOP_CATEGORIES } from "@/lib/catalogCategories";
import { CartDrawer } from "./CartDrawer";

const SHOP_CATEGORY_LINKS = SHOP_CATEGORIES.map((c) => ({ href: c.href, label: c.name }));

const NAV: { href: string; label: string; children?: { href: string; label: string }[] }[] = [
  { href: "/", label: "HOME" },
  { href: "/shop", label: "SHOP", children: SHOP_CATEGORY_LINKS },
  { href: "/school", label: "MINI-STORE FOR SCHOOLS" },
  { href: "/contact", label: "CONTACT" }
];

export function Header() {
  const { count, subtotal } = useCart();
  const { count: wishCount } = useWishlist();
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setDrawerOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy-900/95 backdrop-blur border-b border-gold-900/40" style={{ background: "linear-gradient(135deg, #182230 0%, #0C121A 100%)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="lg:hidden mr-1 p-2 -ml-2 relative z-20 cursor-pointer rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/" className="flex items-center gap-0 shrink-0 min-w-0">
              <Image src="/images/logo.png" alt="AYINDEDUNNY ENTERPRISE logo" width={240} height={160} className="w-auto h-11 sm:h-16 md:h-[4.5rem] object-contain shrink-0" />
              <span className="block min-w-0">
                <span className="block font-display font-extrabold text-sm sm:text-lg md:text-xl tracking-tight leading-none truncate" style={{ color: "var(--gold-light)" }}>
                  AYINDEDUNNY
                </span>
                <span className="block text-[9px] sm:text-xs md:text-sm font-bold tracking-[0.25em] sm:tracking-[0.3em] uppercase text-white/80 mt-0.5">
                  Enterprise
                </span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              {NAV.map((item) => {
                const active =
                  item.href.split("?")[0] === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href.split("?")[0]);
                if (item.children) {
                  return (
                    <div key={item.label} className="relative group">
                      <Link
                        href={item.href}
                        className={`flex items-center gap-1 text-[13px] font-bold tracking-wide transition-colors ${
                          active ? "text-gold-300" : "text-white/85 hover:text-gold-200"
                        }`}
                      >
                        {item.label} <ChevronDown className="h-3.5 w-3.5" />
                      </Link>
                      <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <div className="min-w-56 rounded-xl bg-navy-900 border border-gold-900/40 p-2 shadow-2xl" style={{ background: "linear-gradient(135deg, #182230 0%, #0C121A 100%)" }}>
                          {item.children.map((c) => (
                            <Link
                              key={c.label}
                              href={c.href}
                              className="block rounded-lg px-3 py-2 text-sm font-semibold text-white/85 hover:text-gold-200 hover:bg-white/10 transition-colors"
                            >
                              {c.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-[13px] font-bold tracking-wide transition-colors ${
                      active ? "text-gold-300" : "text-white/85 hover:text-gold-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-[13px] font-bold tracking-wide text-navy-900 bg-gradient-to-r from-gold-200 to-gold-400 px-3 py-1.5 rounded-lg hover:from-gold-300 hover:to-gold-500"
                >
                  ADMIN
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/wishlist"
                className="relative p-2 rounded-lg text-white/90 hover:bg-white/10"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-400 text-navy-900 text-[10px] font-bold flex items-center justify-center">
                  {wishCount}
                </span>
              </Link>
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative p-2 rounded-lg text-white/90 hover:bg-white/10"
                aria-label="Cart"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-400 text-navy-900 text-[10px] font-bold flex items-center justify-center">
                  {count}
                </span>
              </button>
              <div className="hidden md:block text-sm pl-1 border-l border-white/15 ml-1">
                <span className="text-white/60 block text-[10px] uppercase tracking-wide leading-none mb-0.5">Total</span>
                <span className="font-bold text-gold-200">{formatPrice(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[65] bg-navy-950/60" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-72 bg-navy-900 shadow-xl p-5 flex flex-col"
            style={{ background: "linear-gradient(135deg, #182230 0%, #0C121A 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-0">
                <Image src="/images/logo.png" alt="AYINDEDUNNY ENTERPRISE logo" width={48} height={32} className="w-auto h-9 object-contain -mr-1" />
                <span className="font-display font-extrabold text-gold-200 leading-tight">
                  AYINDEDUNNY
                  <span className="block text-[9px] font-bold tracking-[0.3em] uppercase text-white/70 mt-0.5">
                    Enterprise
                  </span>
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-white">
                <X className="h-6 w-6 text-slate-200" />
              </button>
            </div>
            <nav className="flex flex-col gap-2.5 overflow-y-auto">
              {NAV.map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <Link
                    href={item.href}
                    className="block rounded-lg text-navy-900 font-bold px-4 py-3 text-sm shadow-sm transition-colors"
                    style={{ background: "var(--gold-gradient)" }}
                  >
                    {item.label}
                  </Link>
                  {item.children?.map((c) => (
                    <Link
                      key={c.label}
                      href={c.href}
                      className="block rounded-lg bg-white/5 border border-white/15 text-white hover:bg-white/10 font-semibold px-4 py-2.5 text-sm transition-colors ml-3"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block rounded-lg bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold px-4 py-3 text-sm shadow-sm transition-colors"
                >
                  ADMIN PORTAL
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
