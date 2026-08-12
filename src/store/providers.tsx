"use client";

import { type ReactNode, useEffect } from "react";
import { AuthProvider } from "./auth";
import { CartProvider } from "./cart";
import { WishlistProvider } from "./wishlist";
import { CompareProvider } from "./compare";
import { ToastProvider, useToast } from "./toast";
import { CurrencyProvider, useCurrency } from "./currency";
import { ThemeProvider } from "./theme";
import { useOnline } from "@/hooks/useOnline";
import { useMounted } from "@/hooks/useMounted";
import { syncAll, retryablePendingCount } from "@/lib/sync";
import { setActiveCurrency } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

function ConnectionBanner() {
  const online = useOnline();
  const mounted = useMounted();

  if (!mounted || online) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-slateink text-center text-xs font-semibold py-1.5 px-4">
      You are offline — local mode is active. Changes will sync automatically when you reconnect.
    </div>
  );
}

function SyncWatcher() {
  const online = useOnline();
  const { toast } = useToast();

  useEffect(() => {
    if (online) {
      syncAll()
        .then((r) => {
          if (r.pushed > 0) toast(`Synced ${r.pushed} pending change${r.pushed > 1 ? "s" : ""} to the cloud`);
          if (r.failed > 0) toast(`${r.failed} items failed to sync`, "error");
          if (r.conflicts > 0) toast(`${r.conflicts} sync conflict${r.conflicts > 1 ? "s" : ""} need review`, "error");
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  useEffect(() => {
    if (!online) return;
    const id = window.setInterval(() => {
      syncAll()
        .then(async (r) => {
          if (r.pushed === 0) {
            // Stop polling once nothing can be auto-retried; permanently failed
            // ops stay visible in the Sync panel for a manual retry decision.
            const remaining = await retryablePendingCount();
            if (remaining === 0) window.clearInterval(id);
          }
        })
        .catch(() => {});
    }, 20000);
    return () => window.clearInterval(id);
  }, [online]);

  return null;
}

function ProvidersContent({ children }: { children: ReactNode }) {
  const { currency } = useCurrency();
  setActiveCurrency(currency.code);

  return (
    <div>
      <ConnectionBanner />
      <SyncWatcher />
      {children}
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <ProvidersContent>{children}</ProvidersContent>
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export { Wifi, WifiOff };
