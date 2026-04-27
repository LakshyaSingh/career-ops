"use client";

import { useEffect, useRef, useState } from "react";
import type { Job, JobLogLine, JobStatus } from "@/lib/jobs/types";
import { StatusDot } from "./StatusDot";

interface Props {
  initialJob: Job;
}

export function JobLog({ initialJob }: Props) {
  const [status, setStatus] = useState<JobStatus>(initialJob.status);
  const [exitCode, setExitCode] = useState<number | null | undefined>(initialJob.exitCode);
  const [lines, setLines] = useState<JobLogLine[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/api/jobs/${initialJob.id}/stream`);
    es.addEventListener("log", (e: MessageEvent) => {
      const line = JSON.parse(e.data) as JobLogLine;
      setLines((prev) => [...prev, line]);
    });
    es.addEventListener("status", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { status: JobStatus; exitCode: number | null };
      setStatus(data.status);
      setExitCode(data.exitCode);
    });
    es.addEventListener("done", () => {
      es.close();
    });
    es.onerror = () => {
      // Keep the connection open; EventSource auto-retries.
    };
    return () => es.close();
  }, [initialJob.id]);

  // Auto-scroll only if the user hasn't scrolled up.
  useEffect(() => {
    if (!autoScroll) return;
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines, autoScroll]);

  // Detect manual scroll-up; pause auto-scroll until they hit bottom again.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setAutoScroll(distanceFromBottom < 40);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  async function cancel() {
    if (status !== "running") return;
    setCancelling(true);
    try {
      await fetch(`/api/jobs/${initialJob.id}`, { method: "DELETE" });
    } finally {
      setCancelling(false);
    }
  }

  const isLive = status === "running" || status === "queued";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <StatusDot status={status} pulse />
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {!autoScroll && isLive && (
            <button
              onClick={() => {
                setAutoScroll(true);
                logEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="pill-ghost"
              style={{ border: "none", background: "transparent", cursor: "pointer" }}
            >
              Jump to live ↓
            </button>
          )}
          {isLive && (
            <button
              onClick={cancel}
              disabled={cancelling}
              className="pill-ghost"
              style={{
                color: "#a32018",
                border: "none",
                background: "transparent",
                cursor: cancelling ? "not-allowed" : "pointer",
                opacity: cancelling ? 0.6 : 1,
              }}
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
          {!isLive && exitCode != null && (
            <span style={{ color: "var(--fg-subtle)", fontSize: "0.85rem" }}>
              exit {exitCode}
            </span>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        role="log"
        aria-live="polite"
        style={{
          background: "#0a0a0a",
          color: "#e5e5e5",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontSize: "13px",
          lineHeight: 1.55,
          padding: "1.25rem",
          borderRadius: "16px",
          height: "60vh",
          overflowY: "auto",
          border: "1px solid var(--surface-hairline)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {[...initialJob.log, ...lines].length === 0 && (
          <div style={{ color: "#888" }}>
            {isLive ? "Waiting for first output…" : "No output."}
          </div>
        )}
        {[...initialJob.log, ...lines].map((line, i) => (
          <div
            key={i}
            style={{
              color: line.stream === "err"
                ? "#ff7a6c"
                : line.stream === "system"
                  ? "#7ab8ff"
                  : "#e5e5e5",
            }}
          >
            {line.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
