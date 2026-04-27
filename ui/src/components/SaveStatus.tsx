"use client";

export type Status = "idle" | "saving" | "saved" | "error";

export function SaveStatus({ status, error }: { status: Status; error?: string }) {
  const map: Record<Status, { label: string; color: string }> = {
    idle:   { label: "All changes saved",  color: "var(--fg-subtle)" },
    saving: { label: "Saving…",            color: "var(--fg-muted)" },
    saved:  { label: "Saved",              color: "#1a7f3a" },
    error:  { label: error ?? "Save failed", color: "#a32018" },
  };
  const v = map[status];
  return (
    <span
      style={{
        fontSize: "0.8rem",
        color: v.color,
        fontVariantNumeric: "tabular-nums",
        transition: "color 200ms var(--ease-apple)",
      }}
      role="status"
      aria-live="polite"
    >
      {v.label}
    </span>
  );
}
