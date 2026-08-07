"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, CreditCard, CheckCircle2, WifiOff, ArrowRight, Ticket, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { useOnline } from "@/hooks/useOnline";
import { useMounted } from "@/hooks/useMounted";
import { formatPrice, orderNumber, uid } from "@/lib/utils";
import { api } from "@/lib/api";
import { placeOrder } from "@/lib/sync";
import type { CustomerInfo, Order } from "@/lib/types";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const online = useOnline();
  const router = useRouter();
  const mounted = useMounted();

  const [form, setForm] = useState<CustomerInfo>({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    note: ""
  });

  const [prevUserEmail, setPrevUserEmail] = useState<string | null>(user?.email ?? null);
  if (user && prevUserEmail !== user.email) {
    setPrevUserEmail(user.email);
    setForm((f) => ({ ...f, name: f.name || user.name || "", email: f.email || user.email || "" }));
  }

  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const delivery = subtotal >= 500 ? 0 : 25;
  const total = Math.max(0, Math.round((subtotal + delivery - couponDiscount) * 100) / 100);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await api.post<{ code: string; discount: number; description?: string }>("/coupons/validate", {
        code: couponCode,
        subtotal
      });
      setAppliedCoupon(res.code);
      setCouponDiscount(res.discount);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponError((err as Error).message);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError("");
    setCouponCode("");
  };

  if (placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CheckCircle2 className="h-20 w-20 mx-auto text-emerald-500" />
        <h1 className="mt-6 font-display text-3xl font-extrabold text-slateink dark:text-white">Order Placed Successfully!</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Your order <span className="font-bold text-slateink dark:text-white">{placedOrder.orderNumber}</span> has been received
          {online ? " and is being processed." : " and queued for sync — it will upload automatically when you reconnect."}
        </p>
        <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-sm">
          <p className="font-bold text-slateink dark:text-white">Order Summary</p>
          <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
            {placedOrder.items.map((it) => (
              <p key={it.productId} className="flex justify-between">
                <span>{it.qty} × {it.title}</span>
                <span className="font-semibold">{formatPrice(it.price * it.qty)}</span>
              </p>
            ))}
            {placedOrder.discount ? (
              <p className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon {placedOrder.couponCode} discount</span>
                <span>-{formatPrice(placedOrder.discount)}</span>
              </p>
            ) : null}
            <p className="flex justify-between font-bold text-slateink dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Total</span>
              <span>{formatPrice(placedOrder.total)}</span>
            </p>          </div>
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/shop" className="btn-primary">Continue Shopping</Link>
          <button onClick={() => router.push("/account")} className="btn-outline">View My Orders</button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-extrabold text-slateink dark:text-white">Your cart is empty</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Add some products before checking out.</p>
        <Link href="/shop" className="btn-primary mt-6">Browse Shop</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast("Please provide your name and email", "error");
      return;
    }
    setPlacing(true);
    const order: Order = {
      id: uid("ord"),
      orderNumber: orderNumber(),
      items: items.map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        price: i.product.price,
        qty: i.qty
      })),
      total,
      status: "pending",
      channel: "online",
      customer: form,
      source: "web",
      couponCode: appliedCoupon || undefined,
      discount: couponDiscount || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await placeOrder(order);
    setPlacing(false);
    if (result.online) {
      toast("Order placed! Notification sent to our team.");
    } else {
      toast("You're offline — order saved locally and will sync automatically.", "info");
    }
    await clear();
    setPlacedOrder(result.order);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {mounted && !online && (
        <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 flex items-center gap-3 text-sm text-amber-700 dark:text-amber-300">
          <WifiOff className="h-5 w-5 shrink-0" />
          You are offline. Your order will be stored locally and synced automatically when you reconnect.
        </div>
      )}
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slateink dark:text-white">Secure Checkout</h1>
      <div className="mt-2 h-1 w-14 rounded-full bg-primary-600" />

      <form onSubmit={submit} className="mt-8 grid lg:grid-cols-[1fr_24rem] gap-8">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-bold text-slateink dark:text-white text-lg flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary-600" /> Contact Information
            </h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 800 000 0000" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Delivery Address</label>
                <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Order Notes (optional)</label>
                <textarea className="input min-h-[80px]" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Special instructions for delivery..." />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-slateink dark:text-white text-lg flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary-600" /> Payment Method
            </h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Card Number</label>
                <input className="input" placeholder="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expiry</label>
                  <input className="input" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="label">CVC</label>
                  <input className="input" placeholder="123" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Demo checkout — no real payment is processed. Gateway integration is pluggable.
            </p>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="card p-6">
            <h2 className="font-bold text-slateink dark:text-white text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3">
                  <Image src={product.image} alt={product.title} width={52} height={52} className="rounded-lg w-[52px] h-[52px] object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slateink dark:text-white truncate">{product.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {qty}</p>
                  </div>
                  <span className="text-sm font-bold text-slateink dark:text-white">{formatPrice(product.price * qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-sm">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    <Ticket className="inline h-4 w-4 mr-1" />
                    {appliedCoupon}
                  </span>
                  <button onClick={removeCoupon} className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900" aria-label="Remove coupon">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                      placeholder="Coupon code"
                      className="input pl-9 py-2 text-sm"
                      maxLength={40}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={checkingCoupon || !couponCode.trim()}
                    className="rounded-lg border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 font-bold text-sm px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/40 disabled:opacity-50"
                  >
                    {checkingCoupon ? "..." : "Apply"}
                  </button>
                </form>
              )}
              {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
              {appliedCoupon && (
                <p className="mt-2 text-xs text-emerald-600 font-semibold">
                  You&apos;re saving {formatPrice(couponDiscount)} with {appliedCoupon}
                </p>
              )}
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Delivery</span>
                <span>{delivery === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : formatPrice(delivery)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({appliedCoupon})</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slateink dark:text-white text-base pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={placing}
              className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 text-sm disabled:opacity-60"
            >
              {placing ? "Placing order..." : (
                <>
                  Place Order — {formatPrice(total)} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Your information is encrypted and secure
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
