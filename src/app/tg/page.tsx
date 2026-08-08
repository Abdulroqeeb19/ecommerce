"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        initData: string;
        initDataUnsafe?: { user?: { id?: number; first_name?: string; username?: string } };
        expand: () => void;
        close: () => void;
      };
    };
  }
}

export default function TgStartPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Connecting to your portal...");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;

    const run = async () => {
      const wapp = window.Telegram?.WebApp;
      if (!wapp) {
        setStatus("error");
        setMessage("This page must be opened from inside the @adedunny_bot web app.");
        return;
      }
      try {
        wapp.ready();
        wapp.expand();
        const initData = wapp.initData;
        if (!initData) {
          setStatus("error");
          setMessage("No Telegram session found. Open this from the bot's Web App button.");
          return;
        }
        setStatus("loading");
        const res = await api.post<{ ok: boolean; user: { name?: string; role?: string } }>("/auth/telegram", { initData });
        done.current = true;
        setStatus("ok");
        setMessage(`Welcome, ${res.user?.name || "Store Owner"}! Opening the admin portal…`);
        setTimeout(() => router.replace(res.user?.role === "admin" ? "/admin" : "/school#manager-login"), 600);
      } catch (e) {
        setStatus("error");
        setMessage((e as Error).message || "Could not verify your Telegram session.");
      }
    };

    run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-skyline-100">
          {status === "ok" ? (
            <ShieldCheck className="h-7 w-7 text-skyline-600" />
          ) : status === "error" ? (
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          ) : (
            <Loader2 className="h-7 w-7 animate-spin text-skyline-600" />
          )}
        </div>
        <h1 className="mt-4 font-display text-lg font-extrabold text-slate-900">Mini-Store Portal</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        {status === "error" && (
          <button
            onClick={() => window.Telegram?.WebApp?.close()}
            className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}