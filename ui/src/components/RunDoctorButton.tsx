"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunDoctorButton() {
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
        body: JSON.stringify({ kind: "doctor" }),
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
    <div style={{ display: "inline-flex", flexDirection: "column", gap: "0.4rem" }}>
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
        {submitting ? "Starting…" : "Run full diagnostic"}
      </button>
      {error && <span style={{ color: "#a32018", fontSize: "0.8rem" }}>{error}</span>}
    </div>
  );
}
