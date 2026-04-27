import { readCV } from "@/lib/career-ops/cv";
import { CVEditor } from "@/components/CVEditor";

export const dynamic = "force-dynamic";

export default async function CVPage() {
  const { content, exists } = await readCV();

  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(3rem, 6vw, 5rem)" }}
    >
      <div className="container" style={{ maxWidth: "920px" }}>
        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
          CV
        </p>
        <h1
          className="display"
          style={{ fontSize: "var(--display-lg)", marginBottom: "1rem" }}
        >
          Your CV, in one place.
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
          Markdown is the source of truth. Every evaluation reads from this
          file. Edits autosave to <code>cv.md</code>.
        </p>

        <CVEditor initialContent={content} initialExists={exists} />
      </div>
    </section>
  );
}
