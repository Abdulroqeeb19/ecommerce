"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, Facebook, Instagram, MessageCircle } from "lucide-react";
import { useToast } from "@/store/toast";
import { BRAND_EMAIL, BRAND_PHONES, BRAND_ADDRESS, SLOGAN, MOTTO, FACEBOOK_URL, INSTAGRAM_URL, whatsappLink } from "@/lib/brand";

const QUICK_LINKS = ["Warranty and Returns", "Bulk Corporate Orders", "Mini-Store for Schools Guidelines", "Privacy Policy"];

export function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast("Subscribed to the AYINDEDUNNY ENTERPRISE newsletter!");
    setEmail("");
  };

  return (
    <footer className="text-slate-300 mt-auto" style={{ background: "linear-gradient(135deg, #182230 0%, #0C121A 100%)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-0 mb-4">
              <Image src="/images/logo.png" alt="AYINDEDUNNY ENTERPRISE" width={54} height={36} className="w-auto h-9 object-contain -mr-1" />
              <span className="font-display font-extrabold text-lg text-gold-200 leading-tight">
                AYINDEDUNNY<span className="text-gold-400"> ENTERPRISE</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              <span className="block leading-[1.5]">{SLOGAN}</span>
              <span className="block leading-[1.5] text-slate-500 italic mt-2">Our motto: {MOTTO}.</span>
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" />
                <a href={`mailto:${BRAND_EMAIL}`} className="hover:text-gold-200 transition-colors">
                  {BRAND_EMAIL}
                </a>
              </li>
              {BRAND_PHONES.map((phone) => (
                <li key={phone} className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" />
                  <a href={`tel:+234${phone.replace(/^0/, "")}`} className="hover:text-gold-200 transition-colors">
                    {phone}
                  </a>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" />
                {BRAND_ADDRESS}
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-lg bg-white/10 hover:bg-gold-400/20 p-2 transition-colors">
                <Facebook className="h-4 w-4 text-gold-200" />
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-lg bg-white/10 hover:bg-gold-400/20 p-2 transition-colors">
                <Instagram className="h-4 w-4 text-gold-200" />
              </a>
              <a href={whatsappLink("Hello AYINDEDUNNY ENTERPRISE, I have an enquiry.")} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-lg bg-white/10 hover:bg-gold-400/20 p-2 transition-colors">
                <MessageCircle className="h-4 w-4 text-gold-200" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-gold-200 font-bold text-sm uppercase tracking-wider mb-4">Customer Service</h3>
            <ul className="space-y-2.5 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link}>
                  <Link href="/contact" className="hover:text-gold-200 transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="hover:text-gold-200 transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-200 font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/shop?category=Babies%20Wears" className="hover:text-gold-200 transition-colors">
                  Shop Babies Wears
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Electrical%20Materials%20and%20Fittings" className="hover:text-gold-200 transition-colors">
                  Shop Electrical Materials and Fittings
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Kitchen%20Utensils" className="hover:text-gold-200 transition-colors">
                  Shop Kitchen Utensils
                </Link>
              </li>
              <li>
                <Link href="/school" className="hover:text-gold-200 transition-colors">
                  Mini-Store for Schools
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-gold-200 transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gold-200 font-bold text-sm uppercase tracking-wider mb-4">Corporate and General Merchandise Newsletter</h3>
            <p className="text-sm text-slate-400 mb-4">
              Get new arrivals, general merchandise deals and school supply updates straight to your inbox.
            </p>
            <form onSubmit={subscribe} className="flex">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 min-w-0 rounded-l-lg bg-white/10 border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-gold-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-r-lg text-navy-900 px-4 flex items-center gap-1.5 text-sm font-semibold"
                style={{ background: "var(--gold-gradient)" }}
              >
                <Send className="h-4 w-4" /> SUBSCRIBE
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Copyright © 2026 AYINDEDUNNY ENTERPRISE. All rights reserved.</span>
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
