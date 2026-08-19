"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/store/auth";

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { confirmPasswordReset } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-900/40 p-3">
            <ShieldCheck className="h-6 w-6 text-primary-700 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-slateink dark:text-white">Choose a new password</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Must be at least 12 characters</p>
          </div>
        </div>

        {done ? (
          <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-5 text-sm text-emerald-800 dark:text-emerald-200">
            <p>Your password has been updated and all other sessions were signed out.</p>
            <Link href="/account" className="btn-primary mt-4 inline-block !py-2.5">
              Log in with your new password
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={12}
                required
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                At least 12 characters with an uppercase letter, a lowercase letter and a number.
              </p>
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                minLength={12}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? "Saving..." : "Save new password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-sm text-slate-500">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}