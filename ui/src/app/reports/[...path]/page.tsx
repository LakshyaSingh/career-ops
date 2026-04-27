import Link from "next/link";
import { notFound } from "next/navigation";
import { readReport } from "@/lib/career-ops/reports";
import { MarkdownView } from "@/components/MarkdownView";
import { GeneratePdfButton } from "@/components/GeneratePdfButton";

export const dynamic = "force-dynamic";

/**
 * career-ops reports include `**URL:** <https://...>` in the header. Try a
 * few shapes (autolink, plain URL, markdown link) so we don't miss the JD.
 */
function extractJdUrl(markdown: string): string | null {
  const lines = markdown.split("\n").slice(0, 30); // header is at the top
  const urlLine = lines.find((l) => /\*\*URL:\*\*/i.test(l));
  if (!urlLine) return null;
  // Try markdown autolink <https://...>, then a markdown link [text](url),
  // then the first bare https URL on the line.
  const auto = urlLine.match(/<(https?:\/\/[^>\s]+)>/);
  if (auto) return auto[1];
  const md = urlLine.match(/\[(?:[^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
  if (md) return md[1];
  const bare = urlLine.match(/(https?:\/\/[^\s)]+)/);
  return bare ? bare[1] : null;
}

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

  const jdUrl = extractJdUrl(report.content);

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

        {jdUrl && (
          <aside
            style={{
              marginTop: "3rem",
              paddingTop: "2rem",
              borderTop: "1px solid var(--surface-hairline)",
            }}
          >
            <h3
              className="display"
              style={{
                fontSize: "1.25rem",
                marginBottom: "0.4rem",
                letterSpacing: "-0.018em",
              }}
            >
              Ready to apply?
            </h3>
            <p
              style={{
                color: "var(--fg-muted)",
                fontSize: "0.95rem",
                marginBottom: "1.25rem",
                maxWidth: "55ch",
                lineHeight: 1.5,
              }}
            >
              Generate an ATS-tailored CV for this role. Output lands in{" "}
              <Link href="/output" style={{ color: "var(--accent)" }}>
                output
              </Link>{" "}
              when ready.
            </p>
            <GeneratePdfButton url={jdUrl} />
          </aside>
        )}
      </div>
    </section>
  );
}
