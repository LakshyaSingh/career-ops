"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/jobs/types";
import { StatusDot, statusTone } from "./StatusDot";

const POLL_MS = 2_000;

export function JobTray() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/jobs", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { jobs: Job[] };
        if (!cancelled) setJobs(data.jobs);
      } catch {
        /* ignore — local dev */
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const running = jobs?.filter((j) => j.status === "running").length ?? 0;
  const recent = jobs?.slice(0, 8) ?? [];

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Jobs"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.35rem 0.7rem",
          borderRadius: 999,
          background: running > 0
            ? "color-mix(in srgb, var(--accent) 12%, transparent)"
            : "transparent",
          color: "var(--fg)",
          fontSize: "0.78rem",
          fontWeight: 500,
          cursor: "pointer",
          border: "none",
          transition: "background 200ms var(--ease-apple)",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: running > 0 ? "#0071e3" : "var(--fg-subtle)",
            animation: running > 0 ? "co-pulse 1.6s var(--ease-apple) infinite" : "none",
          }}
        />
        Jobs{running > 0 ? ` · ${running}` : ""}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 320,
            maxWidth: "min(420px, calc(100vw - 32px))",
            background: "var(--bg-elevated)",
            border: "1px solid var(--surface-hairline)",
            borderRadius: 14,
            boxShadow: "0 12px 40px -8px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.05)",
            padding: "0.5rem",
            zIndex: 60,
          }}
        >
          {recent.length === 0 && (
            <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: "var(--fg-muted)", fontSize: "0.9rem" }}>
              No jobs yet.
            </div>
          )}
          {recent.map((j) => {
            const tone = statusTone(j.status);
            return (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "0.7rem 0.85rem",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "var(--fg)",
                  transition: "background 160ms var(--ease-apple)",
                }}
                className="hover:bg-[var(--bg)]"
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 500, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {j.kind === "evaluate" ? "Evaluate" : j.kind} · {hostnameOf(j.target)}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: tone.color, whiteSpace: "nowrap" }}>{tone.label}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--fg-subtle)", marginTop: 2 }}>
                  {ago(j.createdAt)}
                </div>
              </Link>
            );
          })}
          <div style={{ borderTop: "1px solid var(--surface-hairline)", marginTop: 6, padding: "0.5rem 0.85rem" }}>
            <Link
              href="/pipeline"
              onClick={() => setOpen(false)}
              style={{ fontSize: "0.82rem", color: "var(--accent)", textDecoration: "none" }}
            >
              Start a new evaluation →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function hostnameOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function ago(t: number): string {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

