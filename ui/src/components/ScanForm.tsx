"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScanForm() {
  const router = useRouter();
  const [dryRun, setDryRun] = useState(false);
  const [company, setCompany] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "scan",
          dryRun,
          company: company.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      router.push(`/jobs/${data.job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ padding: "1.75rem", marginBottom: "3rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2
            className="display"
            style={{ fontSize: "1.4rem", marginBottom: "0.4rem", letterSpacing: "-0.022em" }}
          >
            Scan portals for new offers
          </h2>
          <p style={{ color: "var(--fg-muted)", fontSize: "0.95rem", maxWidth: "55ch", lineHeight: 1.5 }}>
            Hits Greenhouse, Ashby, and Lever APIs directly — fast, free, no LLM
            tokens. New offers land in your inbox below.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="pill-ghost"
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
          >
            {advanced ? "Hide options" : "Options"}
          </button>
          <button
            type="button"
            onClick={start}
            disabled={submitting}
            className="pill"
            style={{ border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Starting…" : dryRun ? "Dry-run scan" : "Run scan"}
          </button>
        </div>
      </div>

      {advanced && (
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--surface-hairline)",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: "1.25rem",
            rowGap: "1rem",
            alignItems: "center",
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
              color: "var(--fg)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
            />
            Dry run
          </label>
          <span style={{ fontSize: "0.85rem", color: "var(--fg-muted)" }}>
            Preview new offers without writing to <code>data/pipeline.md</code>.
          </span>

          <label style={{ fontSize: "0.9rem", color: "var(--fg)" }}>
            Single company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Anthropic — leave blank to scan all"
            style={{
              padding: "0.55rem 0.85rem",
              background: "var(--bg-elevated)",
              color: "var(--fg)",
              border: "1px solid var(--surface-hairline)",
              borderRadius: 8,
              fontSize: "0.9rem",
              fontFamily: "inherit",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--surface-hairline)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      )}

      {error && (
        <p style={{ color: "#a32018", fontSize: "0.85rem", marginTop: "1rem" }}>{error}</p>
      )}
    </div>
  );
}
