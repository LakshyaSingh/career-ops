import Link from "next/link";
import { readInbox } from "@/lib/career-ops/inbox";
import { ScanForm } from "@/components/ScanForm";
import { InboxRow } from "@/components/InboxRow";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const { pending, processed } = await readInbox();

  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(3rem, 6vw, 5rem)" }}
    >
      <div className="container" style={{ maxWidth: "920px" }}>
        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
          Scan
        </p>
        <h1
          className="display"
          style={{ fontSize: "var(--display-lg)", marginBottom: "1rem" }}
        >
          Find new offers worth your time.
        </h1>
        <p
          style={{
            color: "var(--fg-muted)",
            fontSize: "1.1rem",
            maxWidth: "60ch",
            marginBottom: "2.5rem",
            lineHeight: 1.55,
          }}
        >
          Scans the companies in your{" "}
          <code>portals.yml</code> for new postings matching your title filter,
          dedupes against history, and queues fresh URLs in the inbox below.
        </p>

        <ScanForm />

        <header style={{ marginBottom: "1.5rem" }}>
          <h2
            className="display"
            style={{ fontSize: "1.6rem", letterSpacing: "-0.022em", marginBottom: "0.25rem" }}
          >
            {pending.length === 0 ? "Inbox is clear." : `${pending.length} pending in your inbox.`}
          </h2>
          <p style={{ color: "var(--fg-muted)", fontSize: "0.95rem" }}>
            Click <strong>Evaluate</strong> on any row to start the full A–G report and tracker entry.
          </p>
        </header>

        {pending.length === 0 && processed.length === 0 ? (
          <div
            className="card"
            style={{ padding: "3rem 2rem", textAlign: "center" }}
          >
            <p style={{ color: "var(--fg-muted)", maxWidth: "44ch", margin: "0 auto", lineHeight: 1.55 }}>
              No URLs in <code>data/pipeline.md</code> yet. Run a scan above, or
              add URLs manually with the paste-bar on{" "}
              <Link href="/pipeline" style={{ color: "var(--accent)" }}>/pipeline</Link>.
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {pending.map((e, i) => (
              <InboxRow key={`${e.url}-${i}`} entry={e} />
            ))}
            {processed.length > 0 && pending.length > 0 && (
              <div
                style={{
                  padding: "12px 24px",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--fg-muted)",
                  background: "var(--bg)",
                  borderTop: "1px solid var(--surface-hairline)",
                  borderBottom: "1px solid var(--surface-hairline)",
                }}
              >
                Already processed
              </div>
            )}
            {processed.map((e, i) => (
              <InboxRow key={`p-${e.url}-${i}`} entry={e} />
            ))}
          </div>
        )}

        <p style={{ marginTop: "2rem", color: "var(--fg-subtle)", fontSize: "0.85rem" }}>
          Inbox stored at <code>data/pipeline.md</code> · scan history at{" "}
          <code>data/scan-history.tsv</code>
        </p>
      </div>
    </section>
  );
}
