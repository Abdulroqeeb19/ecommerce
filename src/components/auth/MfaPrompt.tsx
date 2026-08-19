"use client";

import { useState } from "react";
import { ShieldQuestion } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import type { User } from "@/lib/types";

export default function MfaPrompt({
  accountName,
  onSuccess,
  onCancel
}: {
  accountName?: string;
  onSuccess: (user: User) => void;
  onCancel: () => void;
}) {
  const { verifyMfa } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast("Enter the 6-digit code from your authenticator app", "error");
      return;
    }
    setBusy(true);
    try {
      const user = await verifyMfa(code.trim());
      toast("Verification successful");
      onSuccess(user);
    } catch (err) {
      toast((err as Error).message || "Invalid code", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-skyline-50 dark:bg-skyline-900/30 p-4">
        <ShieldQuestion className="h-6 w-6 shrink-0 text-skyline-600 dark:text-skyline-400" />
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Two-step verification</p>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {accountName ? `${accountName}'s ` : ""}account is protected with an authenticator app. Enter the current
            6-digit code to continue.
          </p>
        </div>
      </div>
      <div>
        <label className="label">Authenticator code</label>
        <input
          className="input !tracking-widest !text-center font-mono text-lg"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
        />
      </div>
      <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
        {busy ? "Verifying..." : "Verify & Sign In"}
      </button>
      <button type="button" onClick={onCancel} disabled={busy} className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        Cancel — go back
      </button>
    </form>
  );
}