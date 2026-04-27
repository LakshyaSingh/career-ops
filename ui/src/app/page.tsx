import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { TourPrompt } from "@/components/TourPrompt";

export default function Home() {
  return (
    <>
      <TourPrompt />
      {/* ───────── Hero ───────── */}
      <section
        style={{
          paddingInline: "var(--gutter)",
          paddingBlock: "clamp(6rem, 14vh, 10rem) clamp(4rem, 9vw, 8rem)",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <Reveal>
            <p className="eyebrow" style={{ marginBottom: "1.25rem" }}>
              Job search, re-engineered
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h1
              className="display text-balance"
              style={{
                fontSize: "var(--display-2xl)",
                marginBottom: "1.5rem",
                color: "var(--fg)",
              }}
            >
              Find the few jobs
              <br />
              worth your time.
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p
              className="text-balance"
              style={{
                fontSize: "clamp(1.125rem, 1.4vw + 0.5rem, 1.5rem)",
                lineHeight: 1.4,
                color: "var(--fg-muted)",
                maxWidth: "44ch",
                margin: "0 auto 2.5rem",
              }}
            >
              An AI-powered pipeline that evaluates offers, tailors your CV,
              and tracks every application, running entirely on your laptop.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div
              style={{
                display: "flex",
                gap: "1.25rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link href="/pipeline" className="pill">
                Open your pipeline
              </Link>
              <Link href="/profile" className="pill-ghost">
                Set up your profile <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Stat band ───────── */}
      <section
        style={{
          padding: "clamp(2rem, 4vw, 3rem) var(--gutter)",
          borderBlock: "1px solid var(--surface-hairline)",
          background: "var(--bg-elevated)",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2rem",
            textAlign: "center",
          }}
        >
          {[
            { stat: "740+", label: "Offers evaluated" },
            { stat: "100+", label: "Tailored CVs" },
            { stat: "10×", label: "Faster than spreadsheets" },
            { stat: "No", label: "data leaves your laptop" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div>
                <div
                  className="display"
                  style={{
                    fontSize: "var(--display-md)",
                    color: "var(--fg)",
                  }}
                >
                  {s.stat}
                </div>
                <div
                  style={{
                    color: "var(--fg-muted)",
                    fontSize: "0.95rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Feature triptych ───────── */}
      <section className="section">
        <div className="container">
          <Reveal>
            <h2
              className="display"
              style={{
                fontSize: "var(--display-xl)",
                marginBottom: "0.75rem",
                textAlign: "center",
              }}
            >
              A filter, not a firehose.
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p
              className="text-balance"
              style={{
                color: "var(--fg-muted)",
                fontSize: "1.25rem",
                textAlign: "center",
                maxWidth: "52ch",
                margin: "0 auto 4rem",
              }}
            >
              Companies use AI to filter candidates. We just gave you AI to
              choose companies.
            </p>
          </Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <article
                  className="card"
                  style={{ padding: "2.5rem 2rem", height: "100%" }}
                >
                  <div
                    aria-hidden
                    style={{
                      fontSize: "2rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3
                    className="display"
                    style={{
                      fontSize: "1.5rem",
                      marginBottom: "0.5rem",
                      color: "var(--fg)",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--fg-muted)",
                      fontSize: "0.98rem",
                      lineHeight: 1.55,
                    }}
                  >
                    {f.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section
        className="section"
        style={{
          background: "var(--bg-elevated)",
          borderBlock: "1px solid var(--surface-hairline)",
        }}
      >
        <div className="container">
          <Reveal>
            <h2
              className="display"
              style={{
                fontSize: "var(--display-xl)",
                marginBottom: "4rem",
                textAlign: "center",
              }}
            >
              How it works.
            </h2>
          </Reveal>

          <ol
            style={{
              display: "grid",
              gap: "2.5rem",
              maxWidth: "780px",
              margin: "0 auto",
              listStyle: "none",
              padding: 0,
            }}
          >
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <li
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "2rem",
                    alignItems: "start",
                  }}
                >
                  <span
                    className="display"
                    style={{
                      fontSize: "3rem",
                      color: "var(--accent)",
                      lineHeight: 1,
                      minWidth: "80px",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3
                      className="display"
                      style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}
                    >
                      {s.title}
                    </h3>
                    <p style={{ color: "var(--fg-muted)", lineHeight: 1.6 }}>
                      {s.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="section">
        <div
          className="container"
          style={{ textAlign: "center", maxWidth: "640px" }}
        >
          <Reveal>
            <h2
              className="display text-balance"
              style={{
                fontSize: "var(--display-xl)",
                marginBottom: "2rem",
              }}
            >
              The recruiter you wish you had.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <Link href="/pipeline" className="pill">
              Open your pipeline →
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

const features = [
  {
    icon: "◐",
    title: "Evaluate",
    body:
      "Paste a job URL. Get a structured A–G report scored against your real career story, not keyword soup.",
  },
  {
    icon: "◑",
    title: "Tailor",
    body:
      "ATS-optimized PDFs generated per role. Your CV adapts to each posting without you copy-pasting bullets.",
  },
  {
    icon: "◒",
    title: "Track",
    body:
      "A single source of truth for every application: status, score, follow-ups, and reports, all at a glance.",
  },
];

const steps = [
  {
    title: "Set up your profile.",
    body:
      "Drop in your CV. Tell the system what you’re looking for, what you’re great at, and what you’d rather avoid.",
  },
  {
    title: "Feed it offers.",
    body:
      "Paste URLs one by one, or scan portals like Greenhouse, Ashby, and Lever in batch.",
  },
  {
    title: "Review and decide.",
    body:
      "The system evaluates and recommends. You always make the call. Nothing is ever submitted automatically.",
  },
];
