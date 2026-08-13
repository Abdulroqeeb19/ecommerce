"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE =
  "a, button, input, select, textarea, label, [role='button'], [data-cursor-interactive]";

/**
 * Glowing bubble that trails the native mouse cursor. The bubble lerps behind
 * the pointer with a smooth cinematic lag, expands over interactive elements,
 * and can morph into a label chip via `data-cursor` text on the target element.
 * Disabled on touch / coarse pointers and reduced-motion users.
 */
export function CinemCursor() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const media = window.matchMedia("(pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!media.matches || motion.matches) {
      host.style.display = "none";
      return;
    }

    const bubble = host.querySelector<HTMLDivElement>("[data-bubble]");
    if (!bubble) return;

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const current = { ...target };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      bubble.classList.add("cursor-visible");
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest(INTERACTIVE) as HTMLElement | null;
      const label = el?.dataset.cursor;
      bubble.classList.toggle("cursor-active", Boolean(el));
      host.classList.toggle("cursor-label", Boolean(label));
      if (label) host.dataset.label = label;
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;
      const scale = host.classList.contains("cursor-label")
        ? 1.9
        : bubble.classList.contains("cursor-active")
          ? 1.6
          : 1;
      bubble.style.transform = `translate(${current.x}px, ${current.y}px) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    const onLeave = () => bubble.classList.remove("cursor-visible");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={hostRef} className="cinem-cursor" aria-hidden="true" data-label="">
      <div data-bubble className="cinem-cursor-bubble" />
    </div>
  );
}
