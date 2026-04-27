"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EvaluateForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "evaluate", url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      router.push(`/jobs/${data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card"
      style={{
        padding: "1rem",
        display: "flex",
        gap: "0.75rem",
        alignItems: "stretch",
        marginBottom: "2.5rem",
      }}
    >
      <input
        type="url"
        required
        placeholder="Paste a job URL — Greenhouse, Ashby, Lever, or any company page…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={submitting}
        style={{
          flex: 1,
          padding: "0.75rem 1rem",
          background: "transparent",
          color: "var(--fg)",
          border: "none",
          fontSize: "0.98rem",
          fontFamily: "inherit",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={submitting || !url.trim()}
        className="pill"
        style={{
          opacity: submitting || !url.trim() ? 0.5 : 1,
          cursor: submitting || !url.trim() ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {submitting ? "Starting…" : "Evaluate"}
      </button>
      {error && (
        <span
          role="alert"
          style={{
            position: "absolute",
            marginTop: "3.5rem",
            color: "#a32018",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </span>
      )}
    </form>
  );
}
