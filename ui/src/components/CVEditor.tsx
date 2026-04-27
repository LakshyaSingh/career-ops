"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SaveStatus, type Status } from "./SaveStatus";

const PLACEHOLDER = `# Your Name

## Summary
A short, punchy paragraph that frames who you are professionally.

## Experience

### Senior Engineer · Acme Corp · 2022–Present
- Led X. Shipped Y. Measurable impact: Z.

## Projects

## Education

## Skills
`;

interface Props {
  initialContent: string;
  initialExists: boolean;
}

export function CVEditor({ initialContent, initialExists }: Props) {
  const [content, setContent] = useState(initialContent);
  const [exists, setExists] = useState(initialExists);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | undefined>();
  const lastSavedRef = useRef(initialContent);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (next: string) => {
    setStatus("saving");
    try {
      const res = await fetch("/api/cv", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      lastSavedRef.current = next;
      setExists(true);
      setStatus("saved");
      setTimeout(() => {
        // Only step down to idle if the user hasn't typed since.
        if (lastSavedRef.current === next) setStatus("idle");
      }, 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStatus("error");
    }
  }, []);

  // Debounced autosave: 800ms after the last keystroke.
  useEffect(() => {
    if (content === lastSavedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => save(content), 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [content, save]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        <p
          style={{
            color: "var(--fg-subtle)",
            fontSize: "0.85rem",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {content.length.toLocaleString()} characters
          {!exists && content.length === 0 && " · cv.md will be created on first save"}
        </p>
        <SaveStatus status={status} error={error} />
      </div>
      <textarea
        spellCheck={false}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={PLACEHOLDER}
        style={{
          width: "100%",
          minHeight: "62vh",
          padding: "1.5rem",
          background: "var(--bg-elevated)",
          color: "var(--fg)",
          border: "1px solid var(--surface-hairline)",
          borderRadius: "16px",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontSize: "14px",
          lineHeight: 1.6,
          resize: "vertical",
          outline: "none",
          transition: "border-color 200ms var(--ease-apple), box-shadow 200ms var(--ease-apple)",
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
  );
}
