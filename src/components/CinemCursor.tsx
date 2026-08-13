"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE =
  "a, button, input, select, textarea, label, [role='button'], [data-cursor-interactive]";

/**
 * Cinematic custom cursor: a gold glow dot tracks the pointer exactly while a
 * trailing ring lerps behind with a smooth lag. The ring expands over
 * interactive elements and can display a label via `data-cursor` text on the
 * target element. Disabled on touch / coarse pointers and reduced-motion users.
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

    const dot = host.querySelector<HTMLDivElement>("[data-dot]");
    const ring = host.querySelector<HTMLDivElement>("[data-ring]");
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-cinematic-cursor");

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const current = { ...target };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      dot.classList.remove("cursor-hidden");
      dot.style.transform = `translate(${target.x}px, ${target.y}px)`;
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest(INTERACTIVE) as HTMLElement | null;
      const label = el?.dataset.cursor;
      ring.classList.toggle("cursor-active", Boolean(el));
      host.classList.toggle("cursor-label", Boolean(label));
      if (label) host.dataset.label = label;
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.16;
      current.y += (target.y - current.y) * 0.16;
      ring.style.transform = `translate(${current.x}px, ${current.y}px)`;
      raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      ring.classList.add("cursor-hidden");
      dot.classList.add("cursor-hidden");
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("has-cinematic-cursor");
    };
  }, []);

  return (
    <div ref={hostRef} className="cinem-cursor" aria-hidden="true" data-label="">
      <div data-dot className="cinem-cursor-dot cursor-hidden" />
      <div data-ring className="cinem-cursor-ring cursor-hidden" />
    </div>
  );
}
