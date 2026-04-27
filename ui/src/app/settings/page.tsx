import Link from "next/link";
import { getSystemStatus, type CheckStatus } from "@/lib/career-ops/system";
import { RunDoctorButton } from "@/components/RunDoctorButton";

export const dynamic = "force-dynamic";

const TONE: Record<CheckStatus, { label: string; color: string; bg: string; symbol: string }> = {
  ok:      { label: "Ready",   color: "#1a7f3a", bg: "rgba(48, 209, 88, 0.12)",  symbol: "✓" },
  warn:    { label: "Warning", color: "#a8620a", bg: "rgba(255, 159, 10, 0.14)", symbol: "!" },
  missing: { label: "Missing", color: "#a32018", bg: "rgba(255, 69, 58, 0.12)",  symbol: "—" },
};

export default async function SettingsPage() {
  const status = await getSystemStatus();
  const allReady = status.okCount === status.totalCount;

  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(3rem, 6vw, 5rem)" }}
    >
      <div className="container" style={{ maxWidth: "920px" }}>
        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
          Settings
        </p>
        <h1
          className="display"
          style={{ fontSize: "var(--display-lg)", marginBottom: "1rem" }}
        >
          {allReady ? "Everything's set up." : "A few things to set up."}
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
          {status.okCount}/{status.totalCount} checks ready. The status panel
          below validates the files career-ops needs. For a deeper
          dependency audit (Playwright, npm packages, etc.), run the full
          diagnostic.
        </p>

        {/* ───────── Status grid ───────── */}
        <div
          className="card"
          style={{ overflow: "hidden", marginBottom: "2.5rem" }}
        >
          {status.checks.map((c, i) => {
            const tone = TONE[c.status];
            return (
              <div
                key={c.label}
                role="row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "1.25rem",
                  padding: "1.1rem 1.5rem",
                  alignItems: "start",
                  borderBottom:
                    i === status.checks.length - 1
                      ? undefined
                      : "1px solid var(--surface-hairline)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: tone.bg,
                    color: tone.color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {tone.symbol}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.6rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: "0.98rem" }}>
                      {c.label}
                    </span>
                    {c.path && (
                      <code
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--fg-subtle)",
                          background: "transparent",
                          padding: 0,
                        }}
                      >
                        {c.path}
                      </code>
                    )}
                  </div>
                  <p
                    style={{
                      color: "var(--fg-muted)",
                      fontSize: "0.9rem",
                      lineHeight: 1.5,
                      marginTop: 4,
                    }}
                  >
                    {c.description}
                  </p>
                  {c.hint && (
                    <p
                      style={{
                        color: tone.color,
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                        marginTop: 6,
                      }}
                    >
                      {c.hint}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 500,
                      color: tone.color,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: tone.bg,
                    }}
                  >
                    {tone.label}
                  </span>
                  {c.fixHref && (
                    <Link
                      href={c.fixHref}
                      className="pill-ghost"
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "0.85rem",
                      }}
                    >
                      Fix →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ───────── Full diagnostic ───────── */}
        <div className="card" style={{ padding: "1.75rem", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                className="display"
                style={{
                  fontSize: "1.4rem",
                  marginBottom: "0.4rem",
                  letterSpacing: "-0.022em",
                }}
              >
                Full diagnostic
              </h2>
              <p
                style={{
                  color: "var(--fg-muted)",
                  fontSize: "0.95rem",
                  maxWidth: "55ch",
                  lineHeight: 1.5,
                }}
              >
                Runs <code>node doctor.mjs</code> from the repo root. Validates
                Node version, npm dependencies, the Playwright Chromium
                browser, and every user-data file. Output streams live on the
                job page.
              </p>
            </div>
            <RunDoctorButton />
          </div>
        </div>

        {/* ───────── Environment ───────── */}
        <h2
          className="display"
          style={{
            fontSize: "1.4rem",
            marginBottom: "1rem",
            letterSpacing: "-0.022em",
          }}
        >
          Environment
        </h2>
        <div className="card" style={{ padding: "1.5rem" }}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0.75rem 1.5rem",
              fontSize: "0.9rem",
            }}
          >
            <Field label="Repo root" mono value={status.meta.repoRoot} />
            <Field label="Node" value={`v${status.meta.nodeVersion}`} />
            <Field
              label="Claude Code"
              value={status.meta.claudeVersion ?? "not on PATH"}
              warn={!status.meta.claudeVersion}
            />
            <Field
              label="Git commit"
              mono
              value={status.meta.gitCommit ?? "(no git)"}
            />
          </dl>
        </div>

        <p
          style={{
            marginTop: "2rem",
            color: "var(--fg-subtle)",
            fontSize: "0.85rem",
          }}
        >
          New here, or want a refresher?{" "}
          <Link
            href="/?tour=0"
            style={{ color: "var(--accent)" }}
          >
            Restart the tour →
          </Link>
        </p>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  mono = false,
  warn = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warn?: boolean;
}) {
  return (
    <>
      <dt style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          color: warn ? "#a8620a" : "var(--fg)",
          fontFamily: mono
            ? 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace'
            : "inherit",
          fontSize: mono ? "0.85rem" : "0.9rem",
          wordBreak: "break-all",
        }}
      >
        {value}
      </dd>
    </>
  );
}
