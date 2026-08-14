"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/utils";

export interface HoverOption<T extends string | number = string> {
  value: T;
  label: string;
}

/**
 * Dropdown that opens automatically when the mouse is placed over it and closes
 * the moment the mouse moves away. Works like a `<select>` (option chosen on
 * click) but responds to hover so the list is always visible while browsing.
 */
export function HoverSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  triggerClassName,
  listClassName,
  align = "left"
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly HoverOption<T>[];
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  listClassName?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      ref={rootRef}
      className={cx("relative", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cx("flex items-center justify-between gap-1 cursor-pointer", triggerClassName)}
      >
        <span className="truncate">{selected?.label ?? String(value)}</span>
        <ChevronDown className={cx("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="listbox"
          className={cx(
            "absolute top-full z-40 mt-1 min-w-full max-h-72 overflow-auto rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 py-1 shadow-xl",
            align === "right" ? "right-0" : "left-0",
            listClassName
          )}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cx(
                "block w-full text-left px-3 py-2 text-sm whitespace-nowrap transition-colors",
                o.value === value
                  ? "font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}