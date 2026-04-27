import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { paths } from "@/lib/career-ops/paths";

export const dynamic = "force-dynamic";

interface ReportFile {
  name: string;
  num: string;
  slug: string;
  date: string;
}

async function listReports(): Promise<ReportFile[]> {
  try {
    const dir = paths.reportsDir();
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const m = f.match(/^(\d{3})-(.+?)-(\d{4}-\d{2}-\d{2})\.md$/);
        return m
          ? { name: f, num: m[1], slug: m[2], date: m[3] }
          : { name: f, num: "", slug: f.replace(/\.md$/, ""), date: "" };
      })
      .sort((a, b) => (b.num || "").localeCompare(a.num || ""));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

export default async function ReportsPage() {
  const reports = await listReports();

  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(3rem, 6vw, 5rem)" }}
    >
      <div className="container" style={{ maxWidth: "920px" }}>
        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
          Reports
        </p>
        <h1
          className="display"
          style={{ fontSize: "var(--display-lg)", marginBottom: "1rem" }}
        >
          {reports.length === 0
            ? "No reports yet."
            : `${reports.length} ${reports.length === 1 ? "report" : "reports"}.`}
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
          Each evaluation produces a markdown report with the A–G blocks: role
          summary, CV match, level strategy, comp research, personalization,
          interview prep, and posting legitimacy.
        </p>

        {reports.length === 0 ? (
          <div
            className="card"
            style={{ padding: "4rem 2rem", textAlign: "center" }}
          >
            <p style={{ color: "var(--fg-muted)" }}>
              Your evaluation reports will appear here.
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {reports.map((r) => (
              <Link
                key={r.name}
                href={`/reports/${encodeURIComponent(path.join("reports", r.name))}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 110px 1fr",
                  padding: "18px 24px",
                  borderBottom: "1px solid var(--surface-hairline)",
                  alignItems: "center",
                  color: "var(--fg)",
                  fontSize: "0.95rem",
                }}
                className="hover:bg-[var(--bg)] transition-colors"
              >
                <span style={{ color: "var(--fg-subtle)" }}>{r.num}</span>
                <span style={{ color: "var(--fg-muted)" }}>{r.date}</span>
                <span style={{ fontWeight: 500 }}>
                  {r.slug.replace(/-/g, " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
