"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GeneratePdfButton({ url }: { url: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pdf", url }),
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.5rem",
      }}
    >
      <button
        type="button"
        onClick={start}
        disabled={submitting}
        className="pill"
        style={{
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Starting…" : "Generate tailored PDF"}
      </button>
      {error && (
        <span style={{ color: "#a32018", fontSize: "0.85rem" }}>{error}</span>
      )}
    </div>
  );
}
