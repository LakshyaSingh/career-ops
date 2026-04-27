"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TOUR, TOUR_DONE_KEY } from "@/lib/tour";

export function Tour() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tourParam = search.get("tour");

  const stepIdx = tourParam !== null ? parseInt(tourParam, 10) : -1;
  const active = stepIdx >= 0 && stepIdx < TOUR.length;
  const step = active ? TOUR[stepIdx] : null;

  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // Re-measure the highlighted element on every step / resize / scroll.
  useLayoutEffect(() => {
    if (!step?.target) {
      setHighlightRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(step.target!);
      if (!el) {
        setHighlightRect(null);
        return;
      }
      setHighlightRect(el.getBoundingClientRect());
    };
    // Run after a tick so the destination page has hydrated.
    const t = setTimeout(measure, 100);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step?.target, pathname]);

  // Keyboard: Esc skips, → advances, ← goes back.
  const finish = useCallback(() => {
    try { localStorage.setItem(TOUR_DONE_KEY, "1"); } catch { /* ignore */ }
    const params = new URLSearchParams(search.toString());
    params.delete("tour");
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ""));
  }, [router, pathname, search]);

  const goTo = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= TOUR.length) {
        finish();
        return;
      }
      const next = TOUR[nextIdx];
      const params = new URLSearchParams();
      params.set("tour", String(nextIdx));
      router.push(`${next.path}?${params.toString()}`);
    },
    [router, finish],
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") goTo(stepIdx + 1);
      else if (e.key === "ArrowLeft" && stepIdx > 0) goTo(stepIdx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, stepIdx, finish, goTo]);

  if (!active || !step) return null;

  const isFirst = stepIdx === 0;
  const isLast = stepIdx === TOUR.length - 1;

  return (
    <>
      {/* Soft highlight ring over the target element */}
      {highlightRect && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            borderRadius: 14,
            pointerEvents: "none",
            zIndex: 70,
            boxShadow:
              "0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 28%, transparent), 0 0 30px color-mix(in srgb, var(--accent) 40%, transparent)",
            animation: "co-tour-pulse 1.8s var(--ease-apple) infinite",
            transition: "all 320ms var(--ease-apple)",
          }}
        />
      )}

      {/* Floating card */}
      <div
        role="dialog"
        aria-label={`Tour step ${stepIdx + 1} of ${TOUR.length}: ${step.title}`}
        style={{
          position: "fixed",
          right: "clamp(1rem, 3vw, 2rem)",
          bottom: "clamp(1rem, 3vw, 2rem)",
          width: "min(360px, calc(100vw - 32px))",
          background: "var(--bg-elevated)",
          border: "1px solid var(--surface-hairline)",
          borderRadius: 18,
          padding: "1.25rem 1.4rem",
          zIndex: 80,
          boxShadow:
            "0 24px 60px -16px rgba(0,0,0,0.28), 0 4px 14px rgba(0,0,0,0.08)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          animation: "co-tour-pop 380ms var(--ease-apple)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.6rem",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            Step {stepIdx + 1} of {TOUR.length}
          </span>
          <button
            type="button"
            onClick={finish}
            style={{
              fontSize: "0.78rem",
              color: "var(--fg-subtle)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Skip tour"
          >
            Skip
          </button>
        </div>

        <h2
          className="display"
          style={{
            fontSize: "1.15rem",
            letterSpacing: "-0.02em",
            marginBottom: "0.4rem",
            color: "var(--fg)",
          }}
        >
          {step.title}
        </h2>
        <p
          style={{
            color: "var(--fg-muted)",
            fontSize: "0.92rem",
            lineHeight: 1.55,
            marginBottom: "1.1rem",
          }}
        >
          {step.body}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={() => goTo(stepIdx - 1)}
            disabled={isFirst}
            className="pill-ghost"
            style={{
              background: "transparent",
              border: "none",
              cursor: isFirst ? "not-allowed" : "pointer",
              opacity: isFirst ? 0.3 : 1,
              fontSize: "0.85rem",
              padding: "0.35rem 0.5rem",
            }}
          >
            ← Back
          </button>

          {/* Step dots */}
          <div style={{ display: "flex", gap: 4 }} aria-hidden>
            {TOUR.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background:
                    i === stepIdx
                      ? "var(--accent)"
                      : "var(--surface-hairline)",
                  transition: "background 200ms var(--ease-apple)",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(stepIdx + 1)}
            className="pill"
            style={{
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: "0.45rem 1rem",
            }}
          >
            {step.nextLabel ?? (isLast ? "Done" : "Next →")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes co-tour-pulse {
          0%   { box-shadow: 0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 28%, transparent), 0 0 30px color-mix(in srgb, var(--accent) 40%, transparent); }
          50%  { box-shadow: 0 0 0 3px var(--accent), 0 0 0 14px color-mix(in srgb, var(--accent) 12%, transparent), 0 0 40px color-mix(in srgb, var(--accent) 30%, transparent); }
          100% { box-shadow: 0 0 0 3px var(--accent), 0 0 0 9px color-mix(in srgb, var(--accent) 28%, transparent), 0 0 30px color-mix(in srgb, var(--accent) 40%, transparent); }
        }
        @keyframes co-tour-pop {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </>
  );
}
