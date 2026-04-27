import type { JobStatus } from "@/lib/jobs/types";

const TONE: Record<JobStatus, { color: string; label: string }> = {
  queued:      { color: "#a1a1a6", label: "Queued" },
  running:     { color: "#0071e3", label: "Running" },
  succeeded:   { color: "#1a7f3a", label: "Succeeded" },
  failed:      { color: "#a32018", label: "Failed" },
  cancelled:   { color: "#6e6e73", label: "Cancelled" },
  interrupted: { color: "#a8620a", label: "Interrupted" },
};

export function statusTone(status: JobStatus) {
  return TONE[status];
}

export function StatusDot({ status, pulse }: { status: JobStatus; pulse?: boolean }) {
  const tone = TONE[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.85rem",
        color: tone.color,
        fontWeight: 500,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: tone.color,
          animation: pulse && status === "running" ? "co-pulse 1.6s var(--ease-apple) infinite" : "none",
        }}
      />
      <style>{`
        @keyframes co-pulse {
          0%   { box-shadow: 0 0 0 0 color-mix(in srgb, ${tone.color} 60%, transparent); }
          70%  { box-shadow: 0 0 0 10px color-mix(in srgb, ${tone.color} 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, ${tone.color} 0%, transparent); }
        }
      `}</style>
      {tone.label}
    </span>
  );
}
