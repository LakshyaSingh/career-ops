import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { paths, repoRoot } from "./paths";

const execFile = promisify(execFileCb);

export type CheckStatus = "ok" | "missing" | "warn";

export interface Check {
  label: string;
  description: string;
  path?: string;            // relative to repo root, displayed monospace
  status: CheckStatus;
  hint?: string;            // what to do if not ok
  fixHref?: string;         // route inside the UI that fixes it
}

export interface SystemStatus {
  checks: Check[];
  okCount: number;
  totalCount: number;
  /** Repo root + node version + current commit */
  meta: {
    repoRoot: string;
    nodeVersion: string;
    gitCommit: string | null;
    claudeVersion: string | null;
  };
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function fileCheck(
  full: string,
  rel: string,
  spec: { label: string; description: string; hint: string; fixHref?: string },
): Promise<Check> {
  const ok = await exists(full);
  return {
    label: spec.label,
    description: spec.description,
    path: rel,
    status: ok ? "ok" : "missing",
    hint: ok ? undefined : spec.hint,
    fixHref: ok ? undefined : spec.fixHref,
  };
}

async function tryRun(bin: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFile(bin, args, { cwd: repoRoot(), timeout: 3000 });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const root = repoRoot();

  const checks: Check[] = await Promise.all([
    fileCheck(paths.cv(), "cv.md", {
      label: "CV",
      description: "Markdown source of truth — every evaluation reads from this file.",
      hint: "Open the CV editor and paste your CV — it'll be created on first save.",
      fixHref: "/cv",
    }),
    fileCheck(paths.profile(), "config/profile.yml", {
      label: "Profile",
      description: "Identity, target roles, narrative, compensation, and location.",
      hint: "Open the profile editor — fields you fill in will create the file.",
      fixHref: "/profile",
    }),
    fileCheck(paths.modesProfile(), "modes/_profile.md", {
      label: "User profile mode",
      description: "Per-user customization layer career-ops uses to override system prompts.",
      hint: "Career-ops auto-creates this from the template on first session — open Claude Code in the repo to seed it.",
    }),
    fileCheck(paths.portals(), "portals.yml", {
      label: "Portals",
      description: "Companies and title filters used by the scanner.",
      hint: "Copy templates/portals.example.yml to portals.yml and customize for your target roles.",
      fixHref: "/scan",
    }),
    fileCheck(paths.applications(), "data/applications.md", {
      label: "Applications tracker",
      description: "The single source of truth for every offer you've evaluated.",
      hint: "Auto-created when you run your first evaluation. No action needed yet.",
    }),
    fileCheck(paths.pipeline(), "data/pipeline.md", {
      label: "URL inbox",
      description: "Where the scanner queues new offers for you to review.",
      hint: "Auto-created on first scan. Run a scan to populate it.",
      fixHref: "/scan",
    }),
    (async (): Promise<Check> => {
      const ok = await exists(paths.outputDir());
      return {
        label: "Output directory",
        description: "Where tailored CVs and other generated files land.",
        path: "output/",
        status: ok ? "ok" : "missing",
        hint: ok ? undefined : "Will be created on the first PDF generation.",
      };
    })(),
    (async (): Promise<Check> => {
      const ok = await exists(paths.reportsDir());
      return {
        label: "Reports directory",
        description: "Where evaluation A–G markdown reports are saved.",
        path: "reports/",
        status: ok ? "ok" : "missing",
        hint: ok ? undefined : "Will be created on the first evaluation.",
      };
    })(),
    (async (): Promise<Check> => {
      // career-ops requires Node 18+; we check the runtime we're on.
      const major = parseInt((process.versions.node ?? "0").split(".")[0], 10);
      const ok = major >= 18;
      return {
        label: "Node.js runtime",
        description: "career-ops requires Node 18 or newer.",
        path: `v${process.versions.node}`,
        status: ok ? "ok" : "warn",
        hint: ok ? undefined : "Upgrade Node — the dev server is running on an old version.",
      };
    })(),
  ]);

  const okCount = checks.filter((c) => c.status === "ok").length;
  const [gitCommit, claudeVersion] = await Promise.all([
    tryRun("git", ["rev-parse", "--short", "HEAD"]),
    tryRun("claude", ["--version"]),
  ]);

  return {
    checks,
    okCount,
    totalCount: checks.length,
    meta: {
      repoRoot: root,
      nodeVersion: process.versions.node,
      gitCommit,
      claudeVersion,
    },
  };
}
