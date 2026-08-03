"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingCart,
  Lock,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  Package,
  X
} from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { useOnline } from "@/hooks/useOnline";
import { useToast } from "@/store/toast";
import { useAuth } from "@/store/auth";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  GRADE_LABELS,
  GRADE_SCHEDULE,
  type Order
} from "@/lib/types";
import {
  cx,
  formatPrice,
  isOrderingDay,
  nextOrderingDate,
  orderNumber,
  todayDayIndex,
  uid,
  weekdayName
} from "@/lib/utils";
import { placeOrder, syncAll } from "@/lib/sync";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

type BasketItem = { productId: string; title: string; price: number; qty: number };

export default function SchoolPage() {
  const { products } = useProducts();
  const online = useOnline();
  const { toast } = useToast();
  const { user, isManager } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [grade, setGrade] = useState<"JSS1" | "JSS2" | "JSS3">("JSS1");
  const [studentName, setStudentName] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [note, setNote] = useState("");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [supplyFilter, setSupplyFilter] = useState<string>("All");

  const orderingOpen = isOrderingDay(grade);
  const nextDate = useMemo(() => nextOrderingDate(grade), [grade]);

  const miniProducts = useMemo(() => products.filter((p) => p.miniStore), [products]);
  const catalog = useMemo(
    () =>
      supplyFilter === "All"
        ? miniProducts
        : miniProducts.filter((p) => p.supplyType === (supplyFilter === "Groceries" ? "grocery" : "supplies")),
    [miniProducts, supplyFilter]
  );

  const localOrders = useLiveQuery(() => db.orders.toArray(), [], []);
  const schoolOrders = (localOrders || []).filter((o) => o.channel === "school").sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const addItem = (p: { id: string; title: string; price: number }) => {
    setBasket((b) => {
      const existing = b.find((i) => i.productId === p.id);
      return existing
        ? b.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i))
        : [...b, { productId: p.id, title: p.title, price: p.price, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setBasket((b) =>
      b
        .map((i) => (i.productId === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const basketTotal = basket.reduce((s, i) => s + i.price * i.qty, 0);

  const placeSchoolOrder = async () => {
    if (!studentName.trim()) {
      toast("Please enter the student name", "error");
      return;
    }
    if (basket.length === 0) {
      toast("Please add at least one item", "error");
      return;
    }
    setPlacing(true);
    const order: Order = {
      id: uid("sch"),
      orderNumber: orderNumber(),
      items: basket.map((i) => ({ productId: i.productId, title: i.title, price: i.price, qty: i.qty })),
      total: basketTotal,
      status: "pending",
      channel: "school",
      customer: { name: studentName, grade, school: studentSchool, note },
      source: "mini-store",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await placeOrder(order);
    setPlacing(false);
    setBasket([]);
    setPlaced(order);
    if (result.online) toast(`Order ${order.orderNumber} placed!`);
    else toast("Offline — order saved locally, will sync when reconnected.", "info");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-700 to-skyline-600 text-white p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <GraduationCap className="h-4 w-4" /> Boarding School Mini-Store
          </span>
          <h1 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold">Gadget Hub Mini-Store</h1>
          <p className="mt-2 text-slate-200 max-w-2xl text-sm">
            A synchronized ordering portal for boarding school students. Each grade orders on its designated day.
            The portal is managed by exactly three authorized managers and works fully offline.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold">
            <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1", !mounted || online ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200")}>
              {!mounted || online ? <CheckCircle2 className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {!mounted || online ? "Connected — orders sync instantly" : "Offline — local mode active"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" /> RBAC restricted
            </span>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {GRADE_LABELS.map((g) => {
          const active = todayDayIndex() === (g === "JSS1" ? 1 : g === "JSS2" ? 2 : 3);
          return (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={cx(
                "card p-5 text-left transition-all hover:-translate-y-0.5",
                grade === g && "ring-2 ring-primary-600 border-primary-200"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cx("font-display font-extrabold text-lg", grade === g ? "text-primary-700 dark:text-primary-400" : "text-slateink dark:text-white")}>{g}</span>
                <span className={cx("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase", active ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
                  {active ? "Open today" : weekdayName(g === "JSS1" ? 1 : g === "JSS2" ? 2 : 3)}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4 text-primary-600" />
                Ordering day: <span className="font-bold text-slateink dark:text-white">{GRADE_SCHEDULE[g]}</span>
              </p>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Students in {g} can place orders only on {GRADE_SCHEDULE[g]}s.</p>
            </button>
          );
        })}
      </div>

      {/* Ordering status banner */}
      {!orderingOpen ? (
        <div className="mt-6 rounded-xl bg-slateink text-white p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="font-display font-extrabold text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-400" /> Ordering closed for {grade}
            </p>
            <p className="text-sm text-slate-300 mt-1">
              {grade} orders reopen on {GRADE_SCHEDULE[grade]} (JSS1 · Mon, JSS2 · Tue, JSS3 · Wed).
            </p>
          </div>
          <CountdownTimer target={nextDate} />
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-emerald-500 text-white p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="font-display font-extrabold text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Ordering is open for {grade} today!
            </p>
            <p className="text-sm text-emerald-50 mt-1">Place your order below before the day closes.</p>
          </div>
          <span className="rounded-lg bg-white/20 px-4 py-2 text-sm font-bold">{weekdayName(todayDayIndex())} — {grade} day</span>
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-[1fr_22rem] gap-8">
        {/* Catalog */}
        <div>
          <h2 className="font-display text-lg font-extrabold text-slateink dark:text-white mb-4">Student Order Form — {grade}</h2>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            {["All", "School Supplies", "Groceries"].map((c) => (
              <button
                key={c}
                onClick={() => setSupplyFilter(c)}
                className={cx(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                  supplyFilter === c ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {c}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{catalog.length} items</span>
          </div>

          <div className="card p-5 mb-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Student Full Name *</label>
              <input className="input" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Ada Obi" />
            </div>
            <div>
              <label className="label">School / Hostel</label>
              <input className="input" value={studentSchool} onChange={(e) => setStudentSchool(e.target.value)} placeholder="e.g. Greenfield Hostel" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Note to manager (optional)</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any instructions for the mini-store manager" />
            </div>
          </div>

          {catalog.length === 0 ? (
            <div className="card p-12 text-center text-sm text-slate-400 dark:text-slate-500">No items in this category right now. Check back soon.</div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {catalog.map((p) => {
              const inBasket = basket.find((i) => i.productId === p.id);
              return (
                <div key={p.id} className="card overflow-hidden group">
                  <div className="relative aspect-square bg-slatebg dark:bg-slate-800">
                    <Image src={p.image} alt={p.title} width={240} height={240} className="w-full h-full object-cover" />
                    {inBasket && (
                      <span className="absolute top-2 right-2 rounded-full bg-primary-600 text-white text-xs font-bold h-6 w-6 flex items-center justify-center">
                        {inBasket.qty}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400">{p.category}</p>
                    <h3 className="text-xs font-bold text-slateink dark:text-white line-clamp-2 min-h-[2rem]">{p.title}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slateink dark:text-white">{formatPrice(p.price)}</span>
                      {inBasket ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => changeQty(p.id, -1)} className="rounded bg-slate-100 dark:bg-slate-800 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Remove one">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center dark:text-white">{inBasket.qty}</span>
                          <button onClick={() => changeQty(p.id, 1)} className="rounded bg-primary-100 p-1 text-primary-700 hover:bg-primary-200" aria-label="Add one">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem(p)}
                          className="rounded bg-primary-600 text-white p-1.5 hover:bg-primary-700"
                          aria-label={`Add ${p.title}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Order summary */}
        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="card p-6">
            <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary-600" /> Order Summary
            </h3>
            {placed && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm">
                <p className="font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Order {placed.orderNumber} received!
                </p>
                <p className="text-emerald-600 mt-1 text-xs">{placed.customer.name} · {placed.customer.grade} · {formatPrice(placed.total)}</p>
                <button onClick={() => setPlaced(null)} className="mt-2 text-xs font-bold text-emerald-700 underline">Place another order</button>
              </div>
            )}
            {basket.length === 0 && !placed ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">No items selected yet. Tap <Plus className="inline h-3.5 w-3.5" /> on products to add them.</p>
            ) : (
              <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
                {basket.map((i) => (
                  <div key={i.productId} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slateink dark:text-white truncate">{i.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{i.qty} × {formatPrice(i.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => changeQty(i.productId, -1)} className="rounded bg-slate-100 p-1 text-slate-500" aria-label="Decrease">
                        <Minus className="h-3 w-3" />
                      </button>
                      <button onClick={() => changeQty(i.productId, 1)} className="rounded bg-slate-100 p-1 text-slate-500" aria-label="Increase">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between font-bold text-slateink dark:text-white">
                  <span>Total</span>
                  <span>{formatPrice(basketTotal)}</span>
                </div>
              </div>
            )}
            <button
              onClick={placeSchoolOrder}
              disabled={placing || !orderingOpen || basket.length === 0}
              className={cx(
                "w-full mt-5 rounded-lg font-bold py-3 text-sm disabled:opacity-50 transition-colors",
                orderingOpen ? "bg-primary-600 hover:bg-primary-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
              )}
            >
              {placing ? "Placing order..." : orderingOpen ? `Place ${grade} Order` : `Closed until ${GRADE_SCHEDULE[grade]}`}
            </button>
            {mounted && !online && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-amber-600">
                <WifiOff className="h-3.5 w-3.5" /> Saved locally — syncs when online
              </p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-slateink dark:text-white text-sm">How it works</h3>
            <ol className="mt-3 space-y-2 text-xs text-slate-600 list-decimal list-inside">
              <li>Select your grade (JSS1 / JSS2 / JSS3).</li>
              <li>Ordering is only open on your grade's designated day.</li>
              <li>Add items to your order and submit with your name.</li>
              <li>The mini-store manager fulfils your order the same week.</li>
            </ol>
          </div>
        </aside>
      </div>

      {/* Manager section */}
      <section id="manager-login" className="mt-14 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="bg-slateink text-white px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-extrabold text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-skyline-500" /> Mini-Store Manager Panel
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Restricted to exactly three authorized managers (RBAC). Works offline â€” orders sync automatically.
            </p>
          </div>
          {isManager && (
            <span className="rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold px-3 py-1">
              Logged in as {user?.name}
            </span>
          )}
        </div>

        {isManager ? (
          <div className="p-6">
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 font-semibold uppercase">Local Orders</p>
                <p className="font-display text-2xl font-extrabold text-slateink dark:text-white">{schoolOrders.length}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 font-semibold uppercase">Pending Sync</p>
                <p className="font-display text-2xl font-extrabold text-amber-500">
                  {schoolOrders.filter((o) => o.synced === false).length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between">
                <p className="text-xs text-slate-500 font-semibold uppercase">Sync Status</p>
                <button
                  onClick={async () => {
                    const r = await syncAll();
                    toast(`Sync complete: ${r.pushed} pushed, ${r.pulled} pulled${r.failed ? `, ${r.failed} failed` : ""}`, r.failed ? "error" : "success");
                  }}
                  className="btn-primary mt-2 text-xs"
                >
                  <RefreshCw className="h-4 w-4" /> Sync Now
                </button>
              </div>
            </div>

            <h3 className="font-bold text-slateink dark:text-white text-sm mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary-600" /> Recent Mini-Store Orders
            </h3>
            {schoolOrders.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No orders recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead>
                    <tr>
                      <th className="table-th">Order #</th>
                      <th className="table-th">Student</th>
                      <th className="table-th">Grade</th>
                      <th className="table-th">Items</th>
                      <th className="table-th">Total</th>
                      <th className="table-th">Synced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolOrders.slice(0, 15).map((o) => (
                      <tr key={o.id} className="border-b border-slate-100">
                        <td className="table-td font-bold text-slateink dark:text-white">{o.orderNumber}</td>
                        <td className="table-td">{o.customer.name}</td>
                        <td className="table-td">
                          <span className="rounded-full bg-primary-50 text-primary-700 text-xs font-bold px-2 py-0.5">{o.customer.grade}</span>
                        </td>
                        <td className="table-td">
                          {o.items.map((i) => `${i.qty}× ${i.title.split(" - ")[0]}`).join(", ")}
                        </td>
                        <td className="table-td font-bold">{formatPrice(o.total)}</td>
                        <td className="table-td">
                          {o.synced === false ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                              <WifiOff className="h-3.5 w-3.5" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Synced
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <ManagerLogin />
        )}
      </section>
    </div>
  );
}

function ManagerLogin() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast("Manager access granted");
    } catch (err) {
      toast((err as Error).message || "Access denied", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 grid lg:grid-cols-2 gap-8 items-center">
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary-600" /> Authorized Manager Access
        </h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Management options are strictly restricted to the <span className="font-bold text-slateink dark:text-white">three authorized mini-store managers</span>.
          Role-Based Access Control (RBAC) prevents unauthorized access to order management, stock updates and offline operations.
        </p>
        <div className="mt-4 rounded-lg bg-primary-50 border border-primary-100 p-4 text-xs text-primary-700">
          <p className="font-bold mb-1">Demo manager credentials</p>
          <p>manager1@gadgetstore.com / manager123</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Manager Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager1@gadgetstore.com" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
          {busy ? "Verifying..." : "Login to Manager Panel"}
        </button>
      </form>
    </div>
  );
}
