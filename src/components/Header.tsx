"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart, ShoppingCart, Menu, X, Zap } from "lucide-react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useAuth } from "@/store/auth";
import { formatPrice } from "@/lib/utils";
import { CartDrawer } from "./CartDrawer";

const NAV = [
  { href: "/", label: "HOME" },
  { href: "/shop", label: "SHOP" },
  { href: "/shop?category=Office%20Ergonomics", label: "OFFICE GADGETS" },
  { href: "/shop?category=Laptops%20and%20Notebooks", label: "LAPTOPS AND COMPUTERS" },
  { href: "/school", label: "SCHOOL MINI-STORE" },
  { href: "/contact", label: "CONTACT" }
];

export function Header() {
  const { count, subtotal } = useCart();
  const { count: wishCount } = useWishlist();
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            <button className="lg:hidden mr-2 dark:text-slate-200" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6 text-slate-800 dark:text-slate-200" />
            </button>

            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/images/logo.svg" alt="Gadget Hub logo" width={40} height={40} className="w-9 h-9 sm:w-10 sm:h-10" />
              <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-slateink dark:text-white">
                GADGET<span className="text-primary-600"> HUB</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              {NAV.map((item) => {
                const active =
                  item.href.split("?")[0] === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href.split("?")[0]);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-[13px] font-bold tracking-wide transition-colors ${
                      active ? "text-primary-600" : "text-slate-700 dark:text-slate-300 hover:text-primary-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-[13px] font-bold tracking-wide text-primary-700 bg-primary-50 dark:bg-primary-900/40 dark:text-primary-400 px-3 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/60"
                >
                  ADMIN
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/wishlist"
                className="relative p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishCount}
                </span>
              </Link>
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Cart"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {count}
                </span>
              </button>
              <div className="hidden md:block text-sm pl-1 border-l border-slate-200 dark:border-slate-700 ml-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wide leading-none mb-0.5">Total</span>
                <span className="font-bold text-slateink dark:text-white">{formatPrice(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[65] bg-slateink/50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-xl p-5 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-extrabold text-lg text-slateink dark:text-white">
                GADGET<span className="text-primary-600"> HUB</span>
              </span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="dark:text-slate-200">
                <X className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <nav className="flex flex-col gap-2.5">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-3 text-sm shadow-sm transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block rounded-lg bg-skyline-500 hover:bg-skyline-600 text-white font-bold px-4 py-3 text-sm shadow-sm transition-colors"
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
