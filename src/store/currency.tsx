"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface CurrencyDef {
  code: string;
  symbol: string;
  label: string;
  locale: string;
  rate: number;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", locale: "en-NG", rate: 1550 },
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US", rate: 1 },
  { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB", rate: 0.79 },
  { code: "EUR", symbol: "€", label: "Euro", locale: "de-DE", rate: 0.92 }
];

export const DEFAULT_CURRENCY = "NGN";

const STORAGE_KEY = "gh-currency";

interface CurrencyContextValue {
  currency: CurrencyDef;
  currencies: CurrencyDef[];
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CURRENCY;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && CURRENCIES.some((c) => c.code === saved) ? saved : DEFAULT_CURRENCY;
  });

  const setCurrency = useCallback((next: string) => {
    setCode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const currency = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
    return { currency, currencies: CURRENCIES, setCurrency };
  }, [code, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
