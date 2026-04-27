"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Apple-style scroll reveal: a single, calm, restrained fade-up.
 * Triggers once when the element enters the viewport.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "p" | "h1" | "h2" | "h3";
}) {
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      // once:false → fade out when leaving viewport, fade back in on re-entry.
      // This matches Apple's behavior on long product pages where you can
      // scroll up and down and reveals replay each time.
      viewport={{ once: false, amount: 0.2, margin: "-10% 0px -10% 0px" }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
