---
description: Open the Career-Ops web UI in your browser
allowed-tools: Bash(npm:*)
---

Run the Career-Ops UI launcher in the background and let the user know it's
starting up. The launcher will:

1. Install UI dependencies on first run (one-time, ~30s)
2. Start the Next.js dev server on http://localhost:3000
3. Open the user's default browser automatically

Execute:

```bash
npm run ui
```

After kicking it off, tell the user:
- The UI is starting at http://localhost:3000
- First run takes ~30s to install dependencies; subsequent runs are instant
- Their browser will open automatically when the server is ready
- Press Ctrl-C in the terminal to stop the UI

The UI reads and writes the same files this Claude Code session uses
(`cv.md`, `config/profile.yml`, `data/applications.md`, `reports/`, etc.),
so any changes made through the UI are immediately reflected here, and vice
versa.
