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
  const [now, setNow] = useState(() => Date.now());
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

  useEffect(() => {
    if (!isActiveStatus(status)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

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
  const startedAt = initialJob.startedAt ?? initialJob.createdAt;
  const endedAt = initialJob.endedAt ?? now;
  const elapsedMs = Math.max(0, (isLive ? now : endedAt) - startedAt);
  const phase = phaseFor(initialJob.kind, status, lines);

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
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          border: "1px solid var(--surface-hairline)",
          borderRadius: "14px",
          background: "color-mix(in srgb, var(--bg-elevated) 92%, var(--accent) 8%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            color: "var(--fg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              minWidth: 0,
            }}
          >
            <span
              aria-hidden="true"
              className={isLive ? "job-activity-dot job-activity-dot--live" : ""}
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "999px",
                flex: "0 0 auto",
                background:
                  status === "failed" || status === "cancelled"
                    ? "#a32018"
                    : status === "succeeded"
                      ? "#24a148"
                      : "var(--accent)",
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: "var(--fg)",
                  fontSize: "0.94rem",
                  fontWeight: 600,
                  lineHeight: 1.35,
                }}
              >
                {phase}
              </div>
              <div
                style={{
                  color: "var(--fg-subtle)",
                  fontSize: "0.78rem",
                  lineHeight: 1.35,
                  marginTop: "0.15rem",
                }}
              >
                {isLive ? "The job is still running." : statusSummary(status)}
              </div>
            </div>
          </div>
          <span
            style={{
              color: "var(--fg-subtle)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              fontSize: "0.85rem",
            }}
          >
            {formatElapsed(elapsedMs)}
          </span>
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
        {lines.length === 0 && (
          <div style={{ color: "#888" }}>
            {isLive ? "Waiting for first output…" : "No output."}
          </div>
        )}
        {lines.map((line, i) => (
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

function isActiveStatus(status: JobStatus) {
  return status === "running" || status === "queued";
}

function phaseFor(kind: Job["kind"], status: JobStatus, lines: JobLogLine[]) {
  if (status === "queued") return "Queued";
  if (status === "succeeded") return "Completed";
  if (status === "failed") return "Failed";
  if (status === "cancelled") return "Cancelled";
  if (status === "interrupted") return "Interrupted";

  const latest = [...lines].reverse().find((line) => line.text.trim())?.text ?? "";
  if (!latest) return kind === "pdf" ? "Preparing tailored resume" : "Starting evaluation";
  if (latest.includes("Preloaded JD")) {
    return kind === "pdf"
      ? "JD preloaded; Claude is tailoring the resume"
      : "JD preloaded; Claude is starting";
  }
  if (latest.includes("falling back to URL")) return "Reading job URL";
  if (latest.includes("cwd:")) {
    return kind === "pdf"
      ? "Claude is generating the custom CV"
      : "Claude is generating the report";
  }
  if (latest.startsWith("▸ Spawning")) return "Starting Claude";
  if (kind === "pdf" && /PDF generated|Output:.*\.pdf|Tailoring applied/i.test(latest)) {
    return "Finalizing resume output";
  }
  return kind === "pdf" ? "Claude is generating the custom CV" : "Claude is generating the report";
}

function statusSummary(status: JobStatus) {
  switch (status) {
    case "succeeded":
      return "Finished successfully.";
    case "failed":
      return "Stopped with an error.";
    case "cancelled":
      return "Cancelled by the user.";
    case "interrupted":
      return "Interrupted before completion.";
    case "queued":
    case "running":
      return "The job is still running.";
  }
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s elapsed`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s elapsed`;
}
