"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={async () => {
        await deferredPrompt.prompt();
        setDeferredPrompt(null);
      }}
      className="btn-gold px-4 py-2 text-sm font-semibold"
      style={{ background: "var(--gold-gradient)", color: "var(--ink)" }}
    >
      <Download className="h-4 w-4" />
      Install App
    </button>
  );
}
