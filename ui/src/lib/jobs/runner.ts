import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { repoRoot } from "@/lib/career-ops/paths";
import { getJobStore } from "./store";
import type { Job } from "./types";

/**
 * Live process handles aren't persisted — they live alongside the in-memory
 * store and disappear with the process.
 */
const live: Map<string, ChildProcess> = new Map();

export interface StartEvaluateArgs {
  url: string;
}

export interface StartPdfArgs {
  url: string;   // the JD URL/context to tailor against
}

export interface StartScanArgs {
  dryRun?: boolean;
  company?: string;  // optional --company filter
}

export interface StartDoctorArgs {
  // no args — doctor.mjs takes none
}

/**
 * Spawn a Claude Code headless evaluation. The career-ops skill auto-detects
 * a job URL in the prompt and runs the auto-pipeline (evaluate + report +
 * tracker entry).
 *
 * Per career-ops's CLAUDE.md, headless mode (`claude -p`) cannot use
 * Playwright, so reports include `**Verification:** unconfirmed (batch mode)`.
 */
export async function startEvaluateJob(args: StartEvaluateArgs): Promise<Job> {
  return startJob({
    kind: "evaluate",
    target: args.url,
    bin: "claude",
    argv: ["-p", args.url],
    commandForLog: `claude -p "${args.url}"`,
  });
}

/**
 * Spawn a Claude Code headless run that generates an ATS-tailored PDF for
 * the given JD URL. Output lands in `output/cv-{candidate}-{company}-{date}.pdf`.
 */
export async function startPdfJob(args: StartPdfArgs): Promise<Job> {
  const prompt = `/career-ops pdf ${args.url}`;
  return startJob({
    kind: "pdf",
    target: args.url,
    bin: "claude",
    argv: ["-p", prompt],
    commandForLog: `claude -p "${prompt}"`,
  });
}

/**
 * Run career-ops's portal scanner. Pure-Node, zero LLM cost — hits
 * Greenhouse/Ashby/Lever APIs directly and appends new offers to
 * data/pipeline.md and data/scan-history.tsv.
 */
/**
 * Run career-ops's canonical setup checker. Pure-Node, no LLM. Validates
 * Node version, dependencies, Playwright Chromium, and the user-data files
 * (cv.md, config/profile.yml, portals.yml). Output is human-formatted; the
 * UI surfaces a structured quick-status panel separately.
 */
export async function startDoctorJob(_args: StartDoctorArgs = {}): Promise<Job> {
  return startJob({
    kind: "doctor",
    target: "Full system diagnostic",
    bin: "node",
    argv: ["doctor.mjs"],
    commandForLog: "node doctor.mjs",
  });
}

export async function startScanJob(args: StartScanArgs): Promise<Job> {
  const argv = ["scan.mjs"];
  if (args.dryRun) argv.push("--dry-run");
  if (args.company) {
    argv.push("--company", args.company);
  }
  const targetLabel = args.company
    ? `Single company: ${args.company}${args.dryRun ? " (dry run)" : ""}`
    : `All enabled companies${args.dryRun ? " (dry run)" : ""}`;
  return startJob({
    kind: "scan",
    target: targetLabel,
    bin: "node",
    argv,
    commandForLog: `node ${argv.join(" ")}`,
  });
}

interface InternalStartArgs {
  kind: Job["kind"];
  target: string;
  bin: string;            // executable name on PATH
  argv: string[];         // arguments
  commandForLog: string;
}

async function startJob(args: InternalStartArgs): Promise<Job> {
  const store = getJobStore();
  await store.ensureBooted();

  const id = randomUUID();
  const job: Job = {
    id,
    kind: args.kind,
    target: args.target,
    status: "running",
    createdAt: Date.now(),
    startedAt: Date.now(),
    command: args.commandForLog,
    log: [],
  };
  store.upsert(job);

  store.appendLog(id, {
    t: Date.now(),
    stream: "system",
    text: `▸ Spawning: ${args.commandForLog}`,
  });
  store.appendLog(id, {
    t: Date.now(),
    stream: "system",
    text: `  cwd: ${repoRoot()}`,
  });

  let child: ChildProcess;
  try {
    child = spawn(args.bin, args.argv, {
      cwd: repoRoot(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    finish(id, {
      status: "failed",
      exitCode: null,
      reason: e instanceof Error ? e.message : "spawn failed",
    });
    return store.get(id)!;
  }

  live.set(id, child);

  child.stdout?.setEncoding("utf8");
  child.stderr?.setEncoding("utf8");

  let outBuffer = "";
  child.stdout?.on("data", (chunk: string) => {
    outBuffer += chunk;
    const lines = outBuffer.split("\n");
    outBuffer = lines.pop() ?? "";
    for (const line of lines) {
      store.appendLog(id, { t: Date.now(), stream: "out", text: line });
    }
  });

  let errBuffer = "";
  child.stderr?.on("data", (chunk: string) => {
    errBuffer += chunk;
    const lines = errBuffer.split("\n");
    errBuffer = lines.pop() ?? "";
    for (const line of lines) {
      store.appendLog(id, { t: Date.now(), stream: "err", text: line });
    }
  });

  child.on("error", (err) => {
    store.appendLog(id, {
      t: Date.now(),
      stream: "err",
      text: `process error: ${err.message}`,
    });
  });

  child.on("close", (code) => {
    if (outBuffer) store.appendLog(id, { t: Date.now(), stream: "out", text: outBuffer });
    if (errBuffer) store.appendLog(id, { t: Date.now(), stream: "err", text: errBuffer });
    live.delete(id);
    const current = store.get(id);
    // If the user cancelled, status was already set; respect that.
    if (current?.status === "cancelled") {
      finish(id, { status: "cancelled", exitCode: code });
      return;
    }
    finish(id, {
      status: code === 0 ? "succeeded" : "failed",
      exitCode: code,
    });
  });

  return store.get(id)!;
}

export function cancelJob(id: string): boolean {
  const child = live.get(id);
  if (!child) return false;
  const store = getJobStore();
  const job = store.get(id);
  if (!job) return false;
  store.upsert({ ...job, status: "cancelled" });
  store.appendLog(id, {
    t: Date.now(),
    stream: "system",
    text: "▸ Cancelled by user. Sending SIGTERM",
  });
  child.kill("SIGTERM");
  // Give it 5s to die gracefully; SIGKILL otherwise.
  setTimeout(() => {
    if (live.has(id)) {
      store.appendLog(id, {
        t: Date.now(),
        stream: "system",
        text: "▸ Process still alive. Sending SIGKILL",
      });
      child.kill("SIGKILL");
    }
  }, 5000);
  return true;
}

function finish(
  id: string,
  patch: { status: Job["status"]; exitCode?: number | null; reason?: string },
) {
  const store = getJobStore();
  const job = store.get(id);
  if (!job) return;
  if (patch.reason) {
    store.appendLog(id, {
      t: Date.now(),
      stream: "system",
      text: `▸ ${patch.reason}`,
    });
  }
  store.upsert({
    ...job,
    status: patch.status,
    exitCode: patch.exitCode ?? null,
    endedAt: Date.now(),
  });
}
