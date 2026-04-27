import Link from "next/link";
import { notFound } from "next/navigation";
import { readReport } from "@/lib/career-ops/reports";
import { MarkdownView } from "@/components/MarkdownView";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path: segments } = await params;
  let report;
  try {
    report = await readReport(segments);
  } catch {
    notFound();
  }

  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(2.5rem, 5vw, 4rem)" }}
    >
      <div className="container" style={{ maxWidth: "920px" }}>
        <Link
          href="/reports"
          style={{
            color: "var(--fg-muted)",
            fontSize: "0.85rem",
            textDecoration: "none",
            marginBottom: "2rem",
            display: "inline-block",
          }}
        >
          ← Reports
        </Link>

        <header
          style={{
            marginBottom: "2.5rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--surface-hairline)",
          }}
        >
          {report.num && report.date && (
            <p
              className="eyebrow"
              style={{
                marginBottom: "0.5rem",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Report {report.num} · {report.date}
            </p>
          )}
          <p
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              fontSize: "0.8rem",
              color: "var(--fg-subtle)",
            }}
          >
            reports/{report.filename}
          </p>
        </header>

        <MarkdownView source={report.content} />
      </div>
    </section>
  );
}
