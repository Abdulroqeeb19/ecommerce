"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Bell,
  Settings2,
  Save,
  ShieldAlert,
  ShieldCheck,
  Send,
  Lock,
  Store,
  RefreshCw,
  LayoutGrid,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { useOnline } from "@/hooks/useOnline";
import { useMounted } from "@/hooks/useMounted";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { api } from "@/lib/api";
import { AdminDashboard } from "@/components/admin/Dashboard";
import { AdminProducts } from "@/components/admin/Products";
import { AdminOrders } from "@/components/admin/Orders";
import { AdminReports } from "@/components/admin/Reports";
import { SyncPanel } from "@/components/admin/SyncPanel";
import { CategoryCardsPanel } from "@/components/admin/CategoryCardsPanel";
import { CatalogItemsPanel } from "@/components/admin/CatalogItemsPanel";
import { OrderingScheduleEditor } from "@/components/admin/OrderingScheduleEditor";
import { cx } from "@/lib/utils";
import { NOTIFICATION_CHANNELS, type NotificationChannelStatus } from "@/lib/types";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "mini", label: "Mini-Store", icon: Store },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "categories", label: "Shop by Category", icon: LayoutGrid },
  { key: "catalogue", label: "Catalogue", icon: BookOpen },
  { key: "sync", label: "Sync", icon: RefreshCw },
  { key: "notify", label: "Notifications", icon: Bell }
];

function AdminBody() {
  const params = useSearchParams();
  const initial = params.get("tab") || "dashboard";
  const [tab, setTab] = useState<string>(TABS.some((t) => t.key === initial) ? initial : "dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slateink dark:text-white">Admin Portal</h1>
      <div className="mt-2 h-1 w-14 rounded-full bg-primary-600" />

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors",
              tab === key ? "bg-primary-600 text-white shadow" : "bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 hover:border-primary-300 dark:hover:border-primary-500"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "products" && <AdminProducts />}
        {tab === "mini" && (
          <div>
            <OrderingScheduleEditor />
            <AdminProducts miniOnly />
          </div>
        )}
        {tab === "orders" && <AdminOrders />}
        {tab === "reports" && <AdminReports />}
        {tab === "categories" && <CategoryCardsPanel />}
        {tab === "catalogue" && <CatalogItemsPanel />}
        {tab === "sync" && <SyncPanel />}
        {tab === "notify" && <NotifyTab />}
      </div>
    </div>
  );
}

function NotifyTab() {
  const { toast } = useToast();
  const [status, setStatus] = useState<NotificationChannelStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<string>("all");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const check = async () => {
    try {
      const s = await api.get<NotificationChannelStatus>("/notify/status");
      setStatus(s);
    } catch {
      toast("Could not load channel status", "error");
    }
  };

  const loadSettings = async () => {
    try {
      const s = await api.get<Record<string, string>>("/settings/notify");
      setSettings(s);
      setLoaded(true);
    } catch {
      setLoaded(false);
      toast("Could not load notification settings", "error");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async status/settings load on mount
    check();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const saved = await api.put<Record<string, string>>("/settings/notify", settings);
      setSettings(saved);
      await check();
      toast("Notification settings saved");
    } catch (e) {
      toast((e as Error).message || "Could not save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setSending(true);
    try {
      const r = await api.post<{ delivered: string[]; failed: string[] }>("/notify/test", { channel });
      setStatus((await api.get<NotificationChannelStatus>("/notify/status")));
      toast(
        `Delivered: ${r.delivered.join(", ") || "none"}${r.failed.length ? ` · Failed: ${r.failed.join(", ")}` : ""}`,
        r.failed.length ? "error" : "success"
      );
    } catch (e) {
      toast((e as Error).message || "Notification failed", "error");
    } finally {
      setSending(false);
    }
  };

  const channels = [
    { key: "telegram", name: "Telegram Bot API", desc: "Instant alerts via Telegram bots" },
    { key: "whatsapp", name: "WhatsApp Business API", desc: "WhatsApp Cloud API messages" },
    { key: "email", name: "Email (SMTP / SendGrid)", desc: "Transactional order emails" },
    { key: "sms", name: "SMS (Twilio)", desc: "Text message alerts" }
  ];

  const setField = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slateink dark:text-white">Multi-Channel Notifications</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Order placements trigger instant alerts across Telegram, WhatsApp, Email and SMS.
          </p>
        </div>
        <button onClick={check} className="btn-outline text-xs">
          <ShieldCheck className="h-4 w-4" /> Check Channel Status
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slateink dark:text-white">{c.name}</span>
              <span
                className={cx(
                  "h-2.5 w-2.5 rounded-full",
                  status ? (status[c.key as keyof NotificationChannelStatus] ? "bg-emerald-500" : "bg-slate-300") : "bg-slate-200 animate-pulse"
                )}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{c.desc}</p>
            <p className="text-xs mt-2 font-semibold">{status ? (status[c.key as keyof NotificationChannelStatus] ? "Configured" : "Not configured") : "Loading…"}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary-600" /> Channel Configuration
          </h3>
          <button onClick={saveSettings} disabled={saving} className="btn-primary text-xs">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Credentials saved here override <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">.env.local</code> and are stored securely in the database.
        </p>
        {!loaded && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">Settings could not be loaded — check the console or retry.</p>
        )}
        <div className="mt-5 grid md:grid-cols-2 gap-6">
          {NOTIFICATION_CHANNELS.map((cfg) => (
            <div key={cfg.key} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slateink dark:text-white text-sm">{cfg.name}</p>
                <span
                  className={cx(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    status?.[cfg.key] ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  )}
                >
                  {status?.[cfg.key] ? "Ready" : "Not configured"}
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {cfg.fields.map((f) => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input
                      type={f.secret ? "password" : "text"}
                      className="input"
                      value={settings[f.key] || ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 mt-6">
        <h3 className="font-bold text-slateink dark:text-white flex items-center gap-2">
          <Send className="h-5 w-5 text-primary-600" /> Send Test Notification
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Deliveries are attempted to the webhooks configured in <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">.env.local</code>.
          Configure <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">TELEGRAM_BOT_TOKEN</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">WHATSAPP_*</code>,
          <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">SENDGRID_API_KEY</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">TWILIO_*</code> to enable them.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select className="input w-auto" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="all">All configured channels</option>
            {channels.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <button onClick={test} disabled={sending} className="btn-primary">
            {sending ? "Sending..." : "Send Test Alert"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminLogin() {
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
      toast("Admin access granted");
    } catch (err) {
      toast((err as Error).message || "Invalid credentials", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-900/40 p-3">
            <ShieldAlert className="h-6 w-6 text-primary-700 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-slateink dark:text-white">Admin Portal Login</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Restricted to authorized admins only</p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@gadgetstore.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
            {busy ? "Verifying..." : "Access Admin Portal"}
          </button>
        </form>
        <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-bold mb-0.5 flex items-center gap-1"><Lock className="h-3 w-3" /> Demo admin credentials</p>
          <p>admin@gadgetstore.com / Admin@12345</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const online = useOnline();
  const mounted = useMounted();
  const pendingCount = useLiveQuery(() => db.syncQueue.filter((op) => !op.synced).count(), [], 0);

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-24 text-center text-slate-500 dark:text-slate-400">Loading portal...</div>;
  }

  if (!user) return <AdminLogin />;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldAlert className="h-14 w-14 mx-auto text-red-400" />
        <h1 className="mt-4 font-display text-xl font-extrabold text-slateink dark:text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have administrative privileges on this account.</p>
      </div>
    );
  }

  return (
    <>
      {mounted && !online && (
        <div className="bg-amber-500 text-slateink text-center text-xs font-semibold py-1.5 px-4">
          Offline admin mode active — changes are stored locally and will sync when reconnected.
          {pendingCount > 0 && <span className="ml-2">({pendingCount} pending change{pendingCount !== 1 ? "s" : ""})</span>}
        </div>
      )}
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">Loading admin…</div>}>
        <AdminBody />
      </Suspense>
    </>
  );
}
