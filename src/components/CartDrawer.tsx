"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight, MessageCircle } from "lucide-react";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";
import { formatPrice } from "@/lib/utils";
import { BRAND_NAME, whatsappLink } from "@/lib/brand";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, count, subtotal, updateQty, remove } = useCart();
  const { toast } = useToast();
  const [note, setNote] = useState("");

  const delivery = subtotal >= 500 ? 0 : 25;
  const total = subtotal + delivery;

  const orderOnWhatsApp = () => {
    if (items.length === 0) return;
    const lines = items.map(
      (i, idx) => `${idx + 1}. ${i.product.title}${i.product.group ? ` (${i.product.group})` : ""} × ${i.qty} — ${formatPrice(i.product.price * i.qty)}`
    );
    const msg = [
      `Hello ${BRAND_NAME},`,
      ``,
      `I would like to order the following items together:`,
      ``,
      ...lines,
      ``,
      `Subtotal: ${formatPrice(subtotal)}`,
      `Delivery: ${delivery === 0 ? "FREE" : formatPrice(delivery)}`,
      `Total: ${formatPrice(total)}`
    ].join("\n");
    const final = note.trim() ? `${msg}\n\nOrder Notes:\n${note.trim()}` : msg;
    window.open(whatsappLink(final), "_blank", "noopener,noreferrer");
    toast("Opening WhatsApp with all your items");
  };

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-slateink/50 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-navy-800 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h2 className="font-display font-extrabold text-lg text-slateink dark:text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary-600" /> Your Cart ({count})
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slateink dark:hover:text-white" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingBag className="h-14 w-14 text-slate-300" />
            <p className="mt-4 font-semibold text-slateink dark:text-white">Your cart is empty</p>
            <p className="text-sm text-slate-500 mt-1">Tap the cart icon on any product to add it here.</p>
            <Link
              href="/shop"
              onClick={onClose}
              className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-slateink transition-all hover:-translate-y-0.5" style={{ background: "var(--gold-gradient)" }}
            >
              Browse Shop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 divide-y divide-slate-100">
              {items.map(({ product, qty }) => (
                <div key={product.id} className="py-4 flex gap-3">
                  <Image src={product.image} alt={product.title} width={72} height={72} className="rounded-lg w-[72px] h-[72px] object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slateink dark:text-white line-clamp-1">{product.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{product.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md">
                        <button onClick={() => updateQty(product.id, qty - 1)} className="px-2 py-1 text-slate-500 dark:text-slate-300" aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-slateink dark:text-white">{qty}</span>
                        <button onClick={() => updateQty(product.id, qty + 1)} className="px-2 py-1 text-slate-500 dark:text-slate-300" aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-primary-700">{formatPrice(product.price * qty)}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(product.id)} className="self-start p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500" aria-label="Remove item">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold text-slateink dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Delivery</span>
                <span className="text-slate-600 dark:text-slate-400">{delivery === 0 ? "FREE" : formatPrice(delivery)}</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <label className="label" htmlFor="cart-order-note">Order Notes</label>
                <textarea
                  id="cart-order-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add delivery notes or special instructions — sent with all the items above."
                  rows={2}
                  className="input w-full py-2 text-sm resize-none"
                />
              </div>
              <button
                onClick={orderOnWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> Order All ({count}) on WhatsApp — {formatPrice(total)}
              </button>
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-slateink transition-all hover:-translate-y-0.5" style={{ background: "var(--gold-gradient)" }}
              >
                Proceed to Web Checkout <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={onClose} className="w-full text-center text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary-600 py-1">
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
