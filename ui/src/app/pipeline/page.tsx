import Link from "next/link";
import { readTracker } from "@/lib/career-ops/tracker";
import { EvaluateForm } from "@/components/EvaluateForm";

export const dynamic = "force-dynamic"; // always read fresh from disk

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  Evaluated:  { bg: "rgba(0, 113, 227, 0.10)", fg: "#0071e3" },
  Applied:    { bg: "rgba(48, 209, 88, 0.12)",  fg: "#1a7f3a" },
  Responded:  { bg: "rgba(255, 159, 10, 0.14)", fg: "#a8620a" },
  Interview:  { bg: "rgba(191, 90, 242, 0.14)", fg: "#7e23b3" },
  Offer:      { bg: "rgba(48, 209, 88, 0.18)",  fg: "#0e6b2a" },
  Rejected:   { bg: "rgba(255, 69, 58, 0.12)",  fg: "#a32018" },
  Discarded:  { bg: "rgba(0, 0, 0, 0.06)",      fg: "#6e6e73" },
  SKIP:       { bg: "rgba(0, 0, 0, 0.06)",      fg: "#6e6e73" },
};

function scoreColor(n: number | null): string {
  if (n == null) return "var(--fg-subtle)";
  if (n >= 4.5) return "#1a7f3a";
  if (n >= 4.0) return "#0071e3";
  if (n >= 3.0) return "#a8620a";
  return "#a32018";
}

export default async function PipelinePage() {
  const entries = await readTracker();
  // Newest first by `num` (sequential, monotonic per career-ops convention)
  const sorted = [...entries].sort(
    (a, b) => parseInt(b.num, 10) - parseInt(a.num, 10),
  );

  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(3rem, 6vw, 5rem)" }}
    >
      <div className="container">
        <header style={{ marginBottom: "3rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
            Your pipeline
          </p>
          <h1
            className="display"
            style={{ fontSize: "var(--display-lg)", marginBottom: "0.5rem" }}
          >
            {sorted.length === 0
              ? "Nothing here yet."
              : `${sorted.length} ${sorted.length === 1 ? "offer" : "offers"} evaluated.`}
          </h1>
          <p
            style={{
              color: "var(--fg-muted)",
              fontSize: "1.1rem",
              maxWidth: "60ch",
            }}
          >
            {sorted.length === 0
              ? "Paste a job URL below to start your first evaluation. Once it finishes, you’ll see the score, status, and report right here."
              : "Sorted newest first. Click a row to open its evaluation report."}
          </p>
        </header>

        <EvaluateForm />

        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <div role="table" aria-label="Pipeline">
              {/* Header row */}
              <div
                role="row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 110px 1.2fr 1.6fr 90px 130px 60px",
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
                <span>#</span>
                <span>Date</span>
                <span>Company</span>
                <span>Role</span>
                <span style={{ textAlign: "right" }}>Score</span>
                <span>Status</span>
                <span style={{ textAlign: "center" }}>PDF</span>
              </div>

              {sorted.map((e) => {
                const tone =
                  STATUS_TONE[e.status] ??
                  { bg: "rgba(0,0,0,0.05)", fg: "var(--fg-muted)" };
                return (
                  <Link
                    key={e.num}
                    href={
                      e.reportPath
                        ? `/reports/${encodeURIComponent(e.reportPath)}`
                        : "/pipeline"
                    }
                    role="row"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "60px 110px 1.2fr 1.6fr 90px 130px 60px",
                      padding: "18px 24px",
                      borderBottom: "1px solid var(--surface-hairline)",
                      alignItems: "center",
                      color: "var(--fg)",
                      fontSize: "0.95rem",
                      transition: "background 200ms var(--ease-apple)",
                    }}
                    className="hover:bg-[var(--bg)]"
                  >
                    <span style={{ color: "var(--fg-subtle)" }}>{e.num}</span>
                    <span style={{ color: "var(--fg-muted)" }}>{e.date}</span>
                    <span style={{ fontWeight: 500 }}>{e.company}</span>
                    <span style={{ color: "var(--fg-muted)" }}>{e.role}</span>
                    <span
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color: scoreColor(e.scoreNumeric),
                      }}
                    >
                      {e.score}
                    </span>
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          background: tone.bg,
                          color: tone.fg,
                        }}
                      >
                        {e.status}
                      </span>
                    </span>
                    <span style={{ textAlign: "center" }}>
                      {e.pdf ? "✓" : "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      className="card"
      style={{
        padding: "5rem 2rem",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          fontSize: "3rem",
          marginBottom: "1.5rem",
          opacity: 0.5,
        }}
      >
        ○
      </div>
      <h2
        className="display"
        style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}
      >
        Your pipeline is empty.
      </h2>
      <p
        style={{
          color: "var(--fg-muted)",
          maxWidth: "44ch",
          margin: "0 auto 2rem",
          lineHeight: 1.55,
        }}
      >
        Once you evaluate your first offer, you’ll see it here — score, status,
        report, and tailored PDF, all in one row.
      </p>
      <Link href="/profile" className="pill">
        Start with your profile
      </Link>
    </div>
  );
}
