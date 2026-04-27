import Link from "next/link";
import { listOutput } from "@/lib/career-ops/output";

export const dynamic = "force-dynamic";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function ago(t: number): string {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export default async function OutputPage() {
  const files = await listOutput();

  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(3rem, 6vw, 5rem)" }}
    >
      <div className="container" style={{ maxWidth: "920px" }}>
        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
          Output
        </p>
        <h1
          className="display"
          style={{ fontSize: "var(--display-lg)", marginBottom: "1rem" }}
        >
          {files.length === 0
            ? "Nothing generated yet."
            : `${files.length} ${files.length === 1 ? "file" : "files"}.`}
        </h1>
        <p
          style={{
            color: "var(--fg-muted)",
            fontSize: "1.1rem",
            maxWidth: "55ch",
            marginBottom: "3rem",
            lineHeight: 1.55,
          }}
        >
          Tailored CVs and other generated artifacts land in{" "}
          <code>output/</code>. Click any file to view it inline; use the
          download button to save it.
        </p>

        {files.length === 0 ? (
          <div
            className="card"
            style={{ padding: "4rem 2rem", textAlign: "center" }}
          >
            <p style={{ color: "var(--fg-muted)" }}>
              Generate a tailored PDF from any report and it will appear here.
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              role="row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 100px 96px",
                padding: "16px 24px",
                borderBottom: "1px solid var(--surface-hairline)",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--fg-muted)",
                background: "var(--bg)",
              }}
            >
              <span>File</span>
              <span style={{ textAlign: "right" }}>Size</span>
              <span style={{ textAlign: "right" }}>Modified</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {files.map((f) => {
              const href = `/api/files/output/${encodeURIComponent(f.name)}`;
              return (
                <div
                  key={f.name}
                  role="row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px 96px",
                    padding: "16px 24px",
                    borderBottom: "1px solid var(--surface-hairline)",
                    alignItems: "center",
                    fontSize: "0.95rem",
                  }}
                >
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--fg)",
                      textDecoration: "none",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.parsed.candidate && f.parsed.company ? (
                      <>
                        {f.parsed.company.replace(/-/g, " ")}{" "}
                        <span style={{ color: "var(--fg-subtle)" }}>·</span>{" "}
                        <span style={{ color: "var(--fg-muted)" }}>
                          {f.parsed.candidate.replace(/-/g, " ")}
                        </span>
                      </>
                    ) : (
                      f.name
                    )}
                  </a>
                  <span
                    style={{
                      textAlign: "right",
                      color: "var(--fg-muted)",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "0.85rem",
                    }}
                  >
                    {formatBytes(f.size)}
                  </span>
                  <span
                    style={{
                      textAlign: "right",
                      color: "var(--fg-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {ago(f.mtime)}
                  </span>
                  <a
                    href={`${href}?download=1`}
                    style={{
                      textAlign: "right",
                      color: "var(--accent)",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                    }}
                  >
                    Download ↓
                  </a>
                </div>
              );
            })}
          </div>
        )}

        <p
          style={{
            marginTop: "2rem",
            color: "var(--fg-subtle)",
            fontSize: "0.85rem",
          }}
        >
          <Link href="/pipeline" style={{ color: "var(--accent)" }}>
            ← Back to pipeline
          </Link>
        </p>
      </div>
    </section>
  );
}
