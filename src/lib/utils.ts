export const CURRENCY_RATES: Record<string, number> = { NGN: 1550, USD: 1, GBP: 0.79, EUR: 0.92 };
const CURRENCY_LOCALES: Record<string, string> = { NGN: "en-NG", USD: "en-US", GBP: "en-GB", EUR: "de-DE" };

let activeCurrency: string = "NGN";

export function setActiveCurrency(code: string) {
  activeCurrency = code;
}

export function getActiveCurrency(): string {
  return activeCurrency;
}

export function formatPrice(n: number): string {
  const rate = CURRENCY_RATES[activeCurrency] ?? 1;
  const locale = CURRENCY_LOCALES[activeCurrency] ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: activeCurrency,
    minimumFractionDigits: 2
  }).format(n * rate);
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function orderNumber(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `GH-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function daysUntilNext(weekday: number, ref?: Date): number {
  const now = ref || new Date();
  let diff = weekday - now.getDay();
  if (diff <= 0) diff += 7;
  return diff;
}

export function weekdayName(n: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][n] ?? "";
}

export function todayDayIndex(): number {
  return new Date().getDay();
}

export const DEFAULT_ORDERING_SCHEDULE: Record<string, number> = { JSS1: 1, JSS2: 2, JSS3: 3 };

export function gradeOrderingDay(grade: string, schedule: Record<string, number> = DEFAULT_ORDERING_SCHEDULE): number {
  const day = schedule[grade];
  return typeof day === "number" && day >= 0 && day <= 6 ? day : DEFAULT_ORDERING_SCHEDULE[grade] ?? -1;
}

export function isOrderingDay(grade: string, schedule: Record<string, number> = DEFAULT_ORDERING_SCHEDULE): boolean {
  return todayDayIndex() === gradeOrderingDay(grade, schedule);
}

export interface EmergencyOpenWindow {
  grade: string;
  until: string;
  note?: string;
  openedBy?: string;
  createdAt: string;
}

export function isEmergencyOpenFor(grade: string, windows: EmergencyOpenWindow[]): boolean {
  const now = Date.now();
  const active = (windows || []).filter((w) => new Date(w.until).getTime() > now);
  return (
    active.some((w) => w.grade === grade) ||
    active.some((w) => w.grade === "ALL")
  );
}

export function nextOrderingDate(grade: string, schedule: Record<string, number> = DEFAULT_ORDERING_SCHEDULE): Date {
  const target = gradeOrderingDay(grade, schedule);
  const now = new Date();
  const days = daysUntilNext(target, now);
  const next = new Date(now);
  next.setDate(now.getDate() + days);
  next.setHours(8, 0, 0, 0);
  return next;
}

export function countdownTo(date: Date): { days: number; hours: number; mins: number; secs: number } {
  const diff = Math.max(0, date.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000)
  };
}
