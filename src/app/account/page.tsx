"use client";

import { useState } from "react";
import Link from "next/link";
import { User, LogOut, Package, ShieldCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { formatPrice, formatDateTime, cx } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  processing: "bg-skyline-50 dark:bg-skyline-900/40 text-skyline-600 dark:text-skyline-300",
  shipped: "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300",
  delivered: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
};

export default function AccountPage() {
  const { user, loading, login, register, logout, isAdmin, isManager } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [busy, setBusy] = useState(false);

  const localOrders = useLiveQuery(() => db.orders.toArray(), [], []);

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-24 text-center text-slate-500 dark:text-slate-400">Loading account...</div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast("Welcome back!");
      } else {
        if (!name.trim()) throw new Error("Please enter your name");
        await register(name, email, password, {
          ...(grade ? { grade } : {}),
          ...(school.trim() ? { school: school.trim() } : {})
        });
        toast("Account created successfully!");
      }
    } catch (err) {
      toast((err as Error).message || "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="card p-8">
          <h1 className="font-display text-2xl font-extrabold text-slateink dark:text-white flex items-center gap-2">
            <User className="h-6 w-6 text-primary-600" /> My Account
          </h1>
          <div className="mt-5 grid grid-cols-2 rounded-lg bg-slate-100 dark:bg-navy-900 p-1 text-sm font-semibold">
            <button onClick={() => setMode("login")} className={cx("rounded-md py-2 transition-colors", mode === "login" ? "bg-white dark:bg-navy-800 text-primary-700 dark:text-primary-400 shadow" : "text-slate-500 dark:text-slate-400")}>
              Login
            </button>
            <button onClick={() => setMode("register")} className={cx("rounded-md py-2 transition-colors", mode === "register" ? "bg-white dark:bg-navy-800 text-primary-700 dark:text-primary-400 shadow" : "text-slate-500 dark:text-slate-400")}>
              Register
            </button>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Grade (optional)</label>
                    <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
                      <option value="">Select grade</option>
                      <option value="JSS1">JSS1</option>
                      <option value="JSS2">JSS2</option>
                      <option value="JSS3">JSS3</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">School (optional)</label>
                    <input className="input" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Your school" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={mode === "register" ? 12 : 1}
              />
              {mode === "register" && (
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  At least 12 characters with an uppercase letter, a lowercase letter and a number.
                </p>
              )}
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const myOrders = (localOrders || []).filter((o) => {
    if (user.role === "admin" || user.role === "manager") return true;
    return (o.customer?.email || "").toLowerCase() === (user.email || "").toLowerCase();
  });
  const sorted = [...myOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary-600 text-white flex items-center justify-center font-display text-xl font-extrabold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-lg font-extrabold text-slateink dark:text-white">{user.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <span className={cx(
              "inline-block mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              user.role === "admin" ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300" : user.role === "manager" ? "bg-skyline-50 dark:bg-skyline-900/40 text-skyline-600 dark:text-skyline-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            )}>
              {user.role}
            </span>
            {(user.grade || user.school) && (
              <span className="mt-1 inline-flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {user.grade && <span className="rounded-full bg-primary-50 dark:bg-primary-900/40 px-2 py-0.5 font-semibold text-primary-700 dark:text-primary-300">{user.grade}</span>}
                {user.school && <span className="rounded-full bg-skyline-50 dark:bg-skyline-900/40 px-2 py-0.5 font-semibold text-skyline-600 dark:text-skyline-300">{user.school}</span>}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin" className="btn-primary">
              <ShieldCheck className="h-4 w-4" /> Admin Portal
            </Link>
          )}
          {isManager && (
            <Link href="/school#manager-login" className="btn-outline">
              <GraduationCap className="h-4 w-4" /> Mini-Store
            </Link>
          )}
          <button onClick={logout} className="btn-outline !text-red-500 dark:!text-red-400 !border-red-200 dark:!border-red-900 hover:!bg-red-50 dark:hover:!bg-red-900/30">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white flex items-center gap-2">
          <Package className="h-5 w-5 text-primary-600" /> My Orders ({sorted.length})
        </h2>
        {sorted.length === 0 ? (
          <div className="card p-12 text-center mt-4">
            <p className="text-slate-500 dark:text-slate-400">You have no orders yet.</p>
            <Link href="/shop" className="btn-primary mt-4">Start Shopping</Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {sorted.map((order) => (
              <div key={order.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slateink dark:text-white">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(order.createdAt)} · {order.channel} · {order.source}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cx("rounded-full px-3 py-1 text-xs font-bold uppercase", STATUS_STYLES[order.status])}>{order.status}</span>
                    <span className="font-display font-extrabold text-primary-700 dark:text-primary-400">{formatPrice(order.total)}</span>
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
                  {order.items.map((it) => (
                    <p key={it.productId} className="text-sm text-slate-600 dark:text-slate-300 flex justify-between">
                      <span>{it.qty} × {it.title}</span>
                      <span className="font-semibold">{formatPrice(it.price * it.qty)}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
