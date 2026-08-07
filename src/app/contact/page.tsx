"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageCircle, Facebook, Instagram } from "lucide-react";
import { useToast } from "@/store/toast";
import { BRAND_NAME, BRAND_EMAIL, BRAND_PHONES, SLOGAN, MOTTO, FACEBOOK_URL, INSTAGRAM_URL, whatsappLink } from "@/lib/brand";

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "General enquiry", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Message sent! Our team will respond within 24 hours.");
    setForm({ name: "", email: "", subject: "General enquiry", message: "" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl font-extrabold text-slateink dark:text-white">Contact {BRAND_NAME}</h1>
        <div className="mt-2 h-1 w-14 mx-auto rounded-full bg-primary-600" />
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">{SLOGAN}.</p>
        <p className="mt-2 text-primary-700 dark:text-primary-300 font-display font-semibold italic text-sm">&quot;{MOTTO}.&quot;</p>
      </div>

      <div className="mt-10 grid lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[
            { icon: Mail, title: "Email", lines: [BRAND_EMAIL] },
            { icon: Phone, title: "Phone / WhatsApp", lines: [...BRAND_PHONES] },
            { icon: MapPin, title: "Location", lines: ["Shop 5 Opposite", "Nigerian Air Force Base Adewole,", "Ilorin, Kwara State"] }
          ].map(({ icon: Icon, title, lines }) => (
            <div key={title} className="card p-5 flex items-start gap-4">
              <div className="rounded-lg bg-primary-50 p-3 shrink-0">
                <Icon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-bold text-slateink dark:text-white">{title}</p>
                {lines.map((l) => (
                  <p key={l} className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{l}</p>
                ))}
              </div>
            </div>
          ))}
          <div className="card p-5">
            <p className="font-bold text-slateink dark:text-white">Find us online</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="btn-secondary !py-2 !px-3 text-sm">
                <Facebook className="h-4 w-4" /> Facebook
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn-secondary !py-2 !px-3 text-sm">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
              <a href={whatsappLink(`Hello ${BRAND_NAME}, I have an enquiry.`)} target="_blank" rel="noreferrer" className="btn-primary !py-2 !px-3 text-sm">
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-8">
          <h2 className="font-bold text-lg text-slateink dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary-600" /> Send us a message
          </h2>
          <form onSubmit={submit} className="mt-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Your Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Subject</label>
              <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                <option>General enquiry</option>
                <option>Order support</option>
                <option>Bulk corporate orders</option>
                <option>Mini-store for schools</option>
                <option>Warranty and returns</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Message *</label>
              <textarea className="input min-h-[140px]" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary !py-3">
                <Send className="h-4 w-4" /> Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
