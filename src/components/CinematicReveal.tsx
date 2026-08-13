"use client";

import { type CSSProperties, type ElementType, type ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { cx } from "@/lib/utils";

interface CinematicRevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds before the reveal starts after entering the viewport. */
  delay?: number;
  /** Entrance direction / style. */
  variant?: "fade-up" | "fade-in" | "zoom" | "left" | "right";
  as?: ElementType;
  style?: CSSProperties;
}

/**
 * Wraps content and plays a cinematic entrance (blur + translate + opacity)
 * the first time it scrolls into view.
 */
export function CinematicReveal({
  children,
  className,
  delay = 0,
  variant = "fade-up",
  as = "div",
  style
}: CinematicRevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  const Tag = as as ElementType;
  return (
    <Tag
      ref={ref}
      className={cx("cinem-reveal", `cinem-reveal-${variant}`, inView && "is-inview", className)}
      style={{ ...style, transitionDelay: inView ? `${delay}s` : "0s" }}
    >
      {children}
    </Tag>
  );
}
