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
    promptForClaude: args.url,
    commandForLog: `claude -p "${args.url}"`,
  });
}

/**
 * Spawn a Claude Code headless run that generates an ATS-tailored PDF for
 * the given JD URL. Output lands in `output/cv-{candidate}-{company}-{date}.pdf`.
 */
export async function startPdfJob(args: StartPdfArgs): Promise<Job> {
  // Phrase as a slash command so career-ops routes to the `pdf` mode rather
  // than the auto-pipeline. The skill's `_shared.md` recognizes this form.
  const prompt = `/career-ops pdf ${args.url}`;
  return startJob({
    kind: "pdf",
    target: args.url,
    promptForClaude: prompt,
    commandForLog: `claude -p "${prompt}"`,
  });
}

interface InternalStartArgs {
  kind: Job["kind"];
  target: string;
  promptForClaude: string;
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
    child = spawn("claude", ["-p", args.promptForClaude], {
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
    text: "▸ Cancelled by user — sending SIGTERM",
  });
  child.kill("SIGTERM");
  // Give it 5s to die gracefully; SIGKILL otherwise.
  setTimeout(() => {
    if (live.has(id)) {
      store.appendLog(id, {
        t: Date.now(),
        stream: "system",
        text: "▸ Process still alive — sending SIGKILL",
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
