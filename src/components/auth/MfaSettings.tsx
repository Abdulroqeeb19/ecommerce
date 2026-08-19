"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff, KeyRound, Copy, Check } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";

export default function MfaSettings() {
  const { user, enableMfa, verifyEnableMfa, disableMfa, refresh } = useAuth();
  const { toast } = useToast();

  const [enabling, setEnabling] = useState(false);
  const [secret, setSecret] = useState<{ secret: string; uri: string; account: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;
  const enabled = Boolean(user.mfaEnabled);

  const start = async () => {
    setBusy(true);
    try {
      const res = await enableMfa();
      setSecret(res);
      setEnabling(true);
    } catch (e) {
      toast((e as Error).message || "Could not start setup", "error");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast("Enter the 6-digit code from your authenticator app", "error");
      return;
    }
    setBusy(true);
    try {
      await verifyEnableMfa(code.trim());
      await refresh();
      setEnabling(false);
      setSecret(null);
      setCode("");
      toast("Two-factor authentication is now enabled");
    } catch (e) {
      toast((e as Error).message || "Verification failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast("Enter the 6-digit code from your authenticator app", "error");
      return;
    }
    setBusy(true);
    try {
      await disableMfa(code.trim());
      setCode("");
      toast("Two-factor authentication is now disabled");
    } catch (e) {
      toast((e as Error).message || "Could not disable", "error");
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret?.secret || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Could not copy — select the secret manually", "error");
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3">
        {enabled ? (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3">
            <ShieldOff className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          </div>
        )}
        <div>
          <h3 className="font-display text-lg font-extrabold text-slateink dark:text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary-600 dark:text-primary-400" /> Two-Factor Authentication
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {enabled
              ? "This account requires a code from your authenticator app at login."
              : "Add a second verification step — an authenticator app (Google Authenticator, Authy, 1Password…)."}
          </p>
        </div>
      </div>

      {enabling && secret ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-900/30 p-4 text-sm">
            <p className="font-bold text-slateink dark:text-white">Step 1 — Add this account to your app</p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 break-all">
              <a href={secret.uri} className="text-primary-600 dark:text-primary-400 hover:underline">
                Open in your authenticator app
              </a>{" "}
              (or enter the secret key manually):
            </p>
            <button
              type="button"
              onClick={copySecret}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 px-3 py-1.5 font-mono text-xs"
            >
              {secret.secret}
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            </button>
          </div>
          <form onSubmit={confirm} className="space-y-3">
            <div>
              <label className="label">Step 2 — Enter the 6-digit code shown in your app</label>
              <input
                className="input !tracking-widest !text-center font-mono text-lg"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5">
              {busy ? "Verifying..." : "Enable two-factor authentication"}
            </button>
          </form>
        </div>
      ) : enabled ? (
        <form onSubmit={turnOff} className="mt-5 flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1">
            <label className="label">Current code to disable</label>
            <input
              className="input !tracking-widest font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </div>
          <button type="submit" disabled={busy} className="btn-outline !text-red-500 dark:!text-red-400 !border-red-200 dark:!border-red-900 hover:!bg-red-50 dark:hover:!bg-red-900/30 whitespace-nowrap">
            {busy ? "Disabling..." : "Disable"}
          </button>
        </form>
      ) : (
        <button onClick={start} disabled={busy} className="btn-primary mt-5">
          {busy ? "Preparing..." : "Enable two-factor authentication"}
        </button>
      )}
    </div>
  );
}