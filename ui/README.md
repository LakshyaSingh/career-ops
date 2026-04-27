# Career-Ops Web UI

A local web interface for [career-ops](../README.md). Runs on your laptop,
reads and writes the same files Claude Code uses, never leaves your machine.

```
┌──────────────────────────────────────────────────┐
│   Browser  ←→   Next.js (localhost:3000)         │
│                       │                          │
│                       ↓                          │
│              career-ops files                    │
│                       │                          │
│                       ↓                          │
│    spawned subprocesses (claude -p, scan.mjs)    │
└──────────────────────────────────────────────────┘
```

---

## Why this exists

Career-ops is designed around a Claude Code session. That works perfectly,
but means every action is a typed command. The UI gives you:

- **Forms** for editing your CV and profile instead of files
- **A pipeline view** of every job you've evaluated, sortable by score
- **A live job log** for evaluations and scans, like a CI dashboard
- **One-click PDF generation** with download links
- **A doctor diagnostic** when something's misconfigured

It does **not** replace Claude Code — it sits next to it. Both surfaces
write to the same files, so you can flip between them freely.

---

## Quick start

From the **career-ops repo root** (one directory up from this one):

```bash
npm run ui
```

That's it. The launcher will:

1. Install UI dependencies on first run (one-time, ~30s)
2. Start the Next.js dev server on `http://localhost:3000`
3. Open your default browser automatically

Press `Ctrl-C` in the terminal to stop. Subsequent runs are instant.

If you're already inside Claude Code in the career-ops folder, you can also
type `/ui` — the same launcher runs.

---

## What the UI gives you

### `/` — Landing
Apple-style hero. Quick links to Pipeline and Profile.

### `/scan` — Find new offers
Hits Greenhouse, Ashby, and Lever APIs directly via career-ops's
[`scan.mjs`](../scan.mjs). Zero LLM tokens. Optional dry-run + single-company
filter. Pending URLs land in `data/pipeline.md` and appear as an inbox below;
each row has an **Evaluate** button that kicks off the next step.

### `/pipeline` — Your tracker
Reads `data/applications.md` directly. Status pills, score colors, sorted
newest first. Top of the page has a paste-URL bar so you can evaluate any
URL on demand without going through the scan.

### `/profile` — Identity, targets, narrative
Structured form with debounced autosave to `config/profile.yml`. **Field-merge
semantics**: anything not in the form (archetypes, proof points, advanced
narrative) is preserved verbatim on every save, so you can keep editing those
in your editor or via Claude Code without the UI clobbering them.

### `/cv` — Your CV
Full-height markdown editor with autosave to `cv.md`. The first character
creates the file.

### `/jobs/[id]` — Live log per job
Black terminal-style log streaming the subprocess's stdout/stderr in real
time. Auto-scrolls; pauses if you scroll up. **Cancel** button while running
(SIGTERM, then SIGKILL after 5s).

### `/reports` & `/reports/[…path]` — Evaluations
Listing of `reports/{NNN}-{slug}-{date}.md`. Click any one to read the
full A–G report rendered in Apple typography (SF Pro Display, hairline
section dividers, GFM tables, blockquotes). The report viewer extracts the
JD URL from the `**URL:**` header and offers a **Generate tailored PDF**
button at the bottom.

### `/output` — Generated files
File explorer for `output/`. Newest-first. PDFs render inline; **Download ↓**
forces an attachment.

### `/settings` — System health
Two surfaces:
- **Quick status panel** — server-rendered fs.exists checks against every
  well-known career-ops file. Each gets a green/orange/red pill plus a
  **Fix →** link that takes you straight to the right editor.
- **Full diagnostic** — runs `node doctor.mjs` as a job (validates Node,
  npm deps, Playwright Chromium, user-data files), output streams live.

---

## How it talks to career-ops

The UI never re-implements career-ops's logic. Everything is either a direct
file read/write or a subprocess.

### File I/O (read & write)
| File | Where | Mode |
|---|---|---|
| `cv.md` | repo root | r/w via `/cv` |
| `config/profile.yml` | repo root | r/w via `/profile` (field-merge safe) |
| `data/applications.md` | tracker | read-only on `/pipeline` |
| `data/pipeline.md` | URL inbox | read-only on `/scan` |
| `reports/*.md` | evaluations | read-only on `/reports` |
| `output/*` | generated artifacts | read-only on `/output`, served via API |

### Subprocesses (background jobs)
| Job kind | Command | Triggered from |
|---|---|---|
| `evaluate` | `claude -p "<url>"` | `/pipeline` paste bar, `/scan` row buttons |
| `pdf` | `claude -p "/career-ops pdf <url>"` | `/reports/<…>` viewer |
| `scan` | `node scan.mjs [--dry-run] [--company X]` | `/scan` page |
| `doctor` | `node doctor.mjs` | `/settings` page |

Jobs persist to `data/.ui-jobs.json` (gitignored) so they survive Next.js
hot-reload. Across hard restarts, in-flight jobs are marked `interrupted`
on boot so the UI doesn't lie about their status.

### Live log streaming
Each job exposes an SSE endpoint at `/api/jobs/[id]/stream` that replays
the existing log on connect, then emits live `event: log` and
`event: status` frames as the subprocess writes. The job tray in the nav
polls `/api/jobs` every 2 seconds for the running count.

---

## Configuration

### `CAREER_OPS_ROOT`
The launcher assumes the UI lives at `<repo>/ui/`. If you've vendored or
moved things, set `CAREER_OPS_ROOT=/absolute/path/to/career-ops` before
starting `npm run ui` and the UI will resolve all career-ops paths from
there.

### `PORT`
```bash
PORT=3030 npm run ui
```

---

## Stack

- Next.js 16 (App Router) on Turbopack
- React 19
- Tailwind CSS 4 (theme tokens defined in `src/app/globals.css`)
- TypeScript
- `motion` for the Apple-style scroll reveals on the landing page
- `react-markdown` + `remark-gfm` for the report viewer
- `js-yaml` for `profile.yml` round-tripping

No database. No auth. No cloud anything. Module-level state pinned to
`globalThis` so it survives Next.js hot reload.

---

## Working on the UI

```bash
cd ui

npm run dev      # Next dev server (Turbopack)
npm run build    # production build (used by smoke tests)
npm run lint
```

API routes are `force-dynamic` since they read from the local filesystem
on every call — no caching surprises in dev.

### Path safety
The two file-serving routes (`/api/files/output/[...path]` and
`/reports/[...path]`) resolve segments relative to a known root and verify
the result stays inside it. Path traversal attempts (literal `..` or
URL-encoded `%2F..%2F`) return 404.

---

## License

Same as career-ops — MIT.
