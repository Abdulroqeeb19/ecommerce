"use client";

import Link from "next/link";
import Image from "next/image";
import { Laptop, Printer, Monitor, BatteryCharging, ArrowRight } from "lucide-react";

const CAROUSEL = [
  {
    name: "LAPTOPS",
    tagline: "Power for every workload",
    href: "/shop?category=Laptops%20and%20Notebooks",
    image: "/images/products/ultrabook-x15.svg",
    icon: Laptop
  },
  {
    name: "PRINTERS AND TONERS",
    tagline: "Crisp documents on demand",
    href: "/shop?category=Printers%20and%20Scanners",
    image: "/images/products/officejet-pro-print.svg",
    icon: Printer
  },
  {
    name: "SMART DESK TECH",
    tagline: "Elevate your workspace",
    href: "/shop?category=Office%20Ergonomics",
    image: "/images/products/standing-desk-dual.svg",
    icon: Monitor
  },
  {
    name: "POWER AND BACKUP",
    tagline: "Stay online through outages",
    href: "/shop?category=Power%20and%20UPS",
    image: "/images/products/ups-1200va.svg",
    icon: BatteryCharging
  }
];

export function CategoryCarousel() {
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CAROUSEL.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slateink to-primary-900 text-white shadow-card hover:shadow-hover transition-all hover:-translate-y-0.5"
          >
            <Image
              src={item.image}
              alt={item.name}
              width={300}
              height={220}
              className="h-44 w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slateink via-slateink/30 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-4">
              <span className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-skyline-400" />
                <span className="font-display font-extrabold text-sm tracking-wide">{item.name}</span>
              </span>
              <p className="text-xs text-slate-300 mt-0.5">{item.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
