"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InboxEntry } from "@/lib/career-ops/inbox";

export function InboxRow({ entry }: { entry: InboxEntry }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function evaluate() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "evaluate", url: entry.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      router.push(`/jobs/${data.job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setSubmitting(false);
    }
  }

  let host = entry.url;
  try { host = new URL(entry.url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }

  return (
    <div
      role="row"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        padding: "16px 24px",
        borderBottom: "1px solid var(--surface-hairline)",
        alignItems: "center",
        gap: "1rem",
        opacity: entry.done ? 0.55 : 1,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: 2 }}>
          {entry.company}{" "}
          <span style={{ color: "var(--fg-subtle)" }}>·</span>{" "}
          <span style={{ color: "var(--fg-muted)", fontWeight: 400 }}>{entry.title}</span>
        </div>
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--fg-subtle)",
            fontSize: "0.78rem",
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
          title={entry.url}
        >
          {host}
        </a>
        {error && (
          <span style={{ color: "#a32018", fontSize: "0.78rem" }}>{error}</span>
        )}
      </div>
      {entry.done && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--fg-subtle)",
            padding: "2px 8px",
            borderRadius: 999,
            background: "color-mix(in srgb, var(--fg) 6%, transparent)",
          }}
        >
          processed
        </span>
      )}
      <button
        type="button"
        onClick={evaluate}
        disabled={submitting || entry.done}
        className="pill-ghost"
        style={{
          background: "transparent",
          border: "none",
          cursor: submitting || entry.done ? "not-allowed" : "pointer",
          opacity: submitting || entry.done ? 0.5 : 1,
          fontSize: "0.85rem",
          padding: "0.35rem 0.6rem",
        }}
      >
        {submitting ? "Starting…" : "Evaluate →"}
      </button>
    </div>
  );
}
