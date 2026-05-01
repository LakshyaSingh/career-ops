import Link from "next/link";
import { readInbox, type InboxEntry } from "@/lib/career-ops/inbox";
import { ScanForm } from "@/components/ScanForm";
import { InboxRow } from "@/components/InboxRow";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const { pending, processed } = await readInbox();
  const pendingGroups = groupByScanDate(pending);
  const processedGroups = groupByScanDate(processed);

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
            {pendingGroups.map((group) => (
              <ScanDateGroup
                key={`pending-${group.key}`}
                group={group}
                variant="pending"
              />
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
            {processedGroups.map((group) => (
              <ScanDateGroup
                key={`processed-${group.key}`}
                group={group}
                variant="processed"
              />
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

interface ScanDateGroup {
  key: string;
  label: string;
  helper: string;
  entries: InboxEntry[];
}

function ScanDateGroup({
  group,
  variant,
}: {
  group: ScanDateGroup;
  variant: "pending" | "processed";
}) {
  return (
    <section aria-label={`${group.label} ${variant} jobs`}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "14px 24px",
          background:
            variant === "pending"
              ? "color-mix(in srgb, var(--bg-elevated) 88%, var(--accent) 12%)"
              : "var(--bg)",
          borderBottom: "1px solid var(--surface-hairline)",
          borderTop: "1px solid var(--surface-hairline)",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: "var(--fg)",
              fontSize: "0.92rem",
              fontWeight: 650,
            }}
          >
            {group.label}
          </h3>
          <p
            style={{
              margin: "0.2rem 0 0",
              color: "var(--fg-subtle)",
              fontSize: "0.78rem",
            }}
          >
            {group.helper}
          </p>
        </div>
        <span
          style={{
            flex: "0 0 auto",
            color: "var(--fg-muted)",
            fontSize: "0.78rem",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {group.entries.length} {group.entries.length === 1 ? "job" : "jobs"}
        </span>
      </div>
      {group.entries.map((entry, i) => (
        <InboxRow key={`${variant}-${group.key}-${entry.url}-${i}`} entry={entry} />
      ))}
    </section>
  );
}

function groupByScanDate(entries: InboxEntry[]): ScanDateGroup[] {
  const byDate = new Map<string, InboxEntry[]>();
  for (const entry of entries) {
    const key = entry.firstSeen ?? "undated";
    const group = byDate.get(key) ?? [];
    group.push(entry);
    byDate.set(key, group);
  }

  const sorted = [...byDate.entries()]
    .sort(([a], [b]) => compareScanDateKeys(a, b));

  return sorted
    .map(([key, groupEntries], index) => ({
      key,
      label: labelForScanDate(key, index === 0),
      helper: helperForScanDate(key),
      entries: groupEntries,
    }));
}

function compareScanDateKeys(a: string, b: string) {
  if (a === "undated") return 1;
  if (b === "undated") return -1;
  return b.localeCompare(a);
}

function labelForScanDate(key: string, isLatest: boolean) {
  if (key === "undated") return "Manual or older inbox items";
  if (key === todayKey()) return `Today's scan - ${formatScanDate(key)}`;
  if (isLatest) return `Latest scan - ${formatScanDate(key)}`;
  return `Previous scan - ${formatScanDate(key)}`;
}

function helperForScanDate(key: string) {
  if (key === "undated") {
    return "No scan date recorded in scan history.";
  }
  return `First seen ${key}`;
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function formatScanDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return key;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
