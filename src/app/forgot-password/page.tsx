"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { useAuth } from "@/store/auth";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email);
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
            <KeyRound className="h-6 w-6 text-primary-700 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-slateink dark:text-white">Reset your password</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">We&apos;ll email you a one-time reset link</p>
          </div>
        </div>

        {done ? (
          <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-5">
            <MailCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
              If that email exists, a reset link has been sent. It expires in 20 minutes. Check your inbox (and spam).
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
          Remembered it?{" "}
          <Link href="/account" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}