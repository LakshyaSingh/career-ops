export default function ProfilePage() {
  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(3rem, 6vw, 5rem)" }}
    >
      <div className="container" style={{ maxWidth: "780px" }}>
        <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
          Profile
        </p>
        <h1
          className="display"
          style={{ fontSize: "var(--display-lg)", marginBottom: "1rem" }}
        >
          Tell the system who you are.
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
          The system is only as good as what it knows about you. Drop in your
          CV, set your targets, and watch evaluations get sharper with every
          offer.
        </p>

        <div className="card" style={{ padding: "3rem 2rem" }}>
          <h2
            className="display"
            style={{ fontSize: "1.5rem", marginBottom: "1rem" }}
          >
            Coming next
          </h2>
          <p
            style={{
              color: "var(--fg-muted)",
              lineHeight: 1.6,
              marginBottom: "1rem",
            }}
          >
            The CV editor and profile form will live here. They’ll write
            directly to <code>cv.md</code>, <code>config/profile.yml</code>,
            and <code>modes/_profile.md</code> — the same files Claude Code
            reads.
          </p>
          <p style={{ color: "var(--fg-subtle)", fontSize: "0.92rem" }}>
            For now, set up these files manually inside the career-ops folder
            (or ask Claude Code to do it for you), and the rest of the UI will
            pick them up.
          </p>
        </div>
      </div>
    </section>
  );
}
