"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useToast } from "@/store/toast";

const QUICK_LINKS = ["Warranty and Returns", "Bulk Corporate Orders", "School Mini-Store Guidelines", "Privacy Policy"];

export function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast("Subscribed to the Gadget Hub newsletter!");
    setEmail("");
  };

  return (
    <footer className="bg-slateink text-slate-300 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/images/logo.svg" alt="Gadget Hub" width={36} height={36} />
              <span className="font-display font-extrabold text-lg text-white">
                GADGET<span className="text-skyline-500"> HUB</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Next-gen electronics and office gadgets for productive teams, modern schools and ambitious individuals.
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 text-skyline-500 shrink-0" />
                support@gadgetstore.com
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 mt-0.5 text-skyline-500 shrink-0" />
                +234 800 000 0000
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-skyline-500 shrink-0" />
                12 Tech Avenue, Lagos, Nigeria
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 mt-0.5 text-skyline-500 shrink-0" />
                Open 24/7
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Customer Service</h3>
            <ul className="space-y-2.5 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link}>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Shop All Electronics
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Office%20Ergonomics" className="hover:text-white transition-colors">
                  Office Gadgets
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Laptops%20and%20Notebooks" className="hover:text-white transition-colors">
                  Laptops and Computers
                </Link>
              </li>
              <li>
                <Link href="/school" className="hover:text-white transition-colors">
                  School Mini-Store
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Corporate and Tech Newsletter</h3>
            <p className="text-sm text-slate-400 mb-4">
              Get new arrivals, office-tech deals and school supply updates straight to your inbox.
            </p>
            <form onSubmit={subscribe} className="flex">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 min-w-0 rounded-l-lg bg-white/10 border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-skyline-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-r-lg bg-primary-600 hover:bg-primary-500 text-white px-4 flex items-center gap-1.5 text-sm font-semibold"
              >
                <Send className="h-4 w-4" /> SUBSCRIBE
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Copyright © 2026 Gadget Hub. All rights reserved.</span>
          <span className="flex items-center gap-4">
            <span>Offline-First PWA</span>
            <span>·</span>
            <span>Secure Checkout</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
