"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TOUR_DONE_KEY } from "@/lib/tour";

/**
 * First-visit prompt shown above the landing hero. Hidden once the user
 * either takes the tour or dismisses it (state persisted in localStorage).
 */
export function TourPrompt() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_DONE_KEY)) setVisible(true);
    } catch {
      /* localStorage unavailable — just don't show */
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    try { localStorage.setItem(TOUR_DONE_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  }

  function start() {
    router.push("/?tour=0");
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "1rem var(--gutter) 0",
      }}
    >
      <div
        role="status"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.55rem 0.6rem 0.55rem 1.1rem",
          borderRadius: 999,
          background: "color-mix(in srgb, var(--accent) 8%, var(--bg-elevated))",
          border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
          fontSize: "0.88rem",
          color: "var(--fg)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <span aria-hidden style={{ fontSize: "0.78rem" }}>👋</span>
        <span>
          First time here? Take a 60-second walkthrough.
        </span>
        <button
          type="button"
          onClick={start}
          className="pill"
          style={{
            border: "none",
            cursor: "pointer",
            fontSize: "0.82rem",
            padding: "0.35rem 0.95rem",
          }}
        >
          Start tour
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-subtle)",
            fontSize: "1.1rem",
            lineHeight: 1,
            padding: "0 0.3rem",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
