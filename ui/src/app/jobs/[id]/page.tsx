import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobStore } from "@/lib/jobs/store";
import { JobLog } from "@/components/JobLog";
import type { Job } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getJobStore();
  await store.ensureBooted();
  const job = store.get(id);
  if (!job) notFound();
  const jobLabel = labelFor(job.kind);

  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(2.5rem, 5vw, 4rem)" }}
    >
      <div className="container" style={{ maxWidth: "960px" }}>
        <Link
          href="/pipeline"
          style={{
            color: "var(--fg-muted)",
            fontSize: "0.85rem",
            textDecoration: "none",
            marginBottom: "1.25rem",
            display: "inline-block",
          }}
        >
          ← Pipeline
        </Link>

        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
          {jobLabel}
        </p>
        <h1
          className="display"
          style={{
            fontSize: "clamp(1.75rem, 2.5vw + 1rem, 2.5rem)",
            marginBottom: "0.5rem",
            wordBreak: "break-word",
          }}
        >
          {hostnameOf(job.target)}
        </h1>
        <p
          style={{
            color: "var(--fg-subtle)",
            fontSize: "0.85rem",
            marginBottom: "0.5rem",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            wordBreak: "break-all",
          }}
        >
          {job.target}
        </p>
        <p
          style={{
            color: "var(--fg-subtle)",
            fontSize: "0.85rem",
            marginBottom: "2.5rem",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          }}
        >
          {job.command}
        </p>

        <JobLog initialJob={job} />

        <JobNote kind={job.kind} />
      </div>
    </section>
  );
}

function JobNote({ kind }: { kind: Job["kind"] }) {
  const baseStyle = {
    marginTop: "2rem",
    color: "var(--fg-subtle)",
    fontSize: "0.85rem",
    lineHeight: 1.55,
  };

  if (kind === "pdf") {
    return (
      <div style={baseStyle}>
        <strong style={{ color: "var(--fg-muted)" }}>Note:</strong>{" "}
        resume creation can spend most of its time inside Claude while it
        tailors the CV. The progress bar stays live while that generation is
        running, and the finished PDF will appear in your output files.
      </div>
    );
  }

  if (kind !== "evaluate") return null;

  return (
    <div style={baseStyle}>
      <strong style={{ color: "var(--fg-muted)" }}>Note:</strong>{" "}
      headless mode (<code>claude -p</code>) cannot use Playwright, so the
      report will include{" "}
      <code>**Verification:** unconfirmed (batch mode)</code>. Once it
      finishes, the new entry shows up in your{" "}
      <Link href="/pipeline" style={{ color: "var(--accent)" }}>
        pipeline
      </Link>
      .
    </div>
  );
}

function labelFor(kind: Job["kind"]) {
  switch (kind) {
    case "evaluate":
      return "Evaluation";
    case "pdf":
      return "Resume creation";
    case "scan":
      return "Portal scan";
    case "doctor":
      return "System diagnostic";
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
