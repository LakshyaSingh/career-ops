import { promises as fs, existsSync, mkdirSync } from "node:fs";
import { EventEmitter } from "node:events";
import path from "node:path";
import { repoRoot } from "@/lib/career-ops/paths";
import type { Job, JobLogLine } from "./types";

const STORE_FILE = path.join(repoRoot(), "data", ".ui-jobs.json");
const MAX_LOG_LINES = 5000;       // per-job cap to bound memory
const PERSIST_DEBOUNCE_MS = 250;

/**
 * The store survives Next.js dev-server hot reloads by stashing on
 * globalThis — module-level state would otherwise reset every time
 * a file changes.
 */
declare global {
  // eslint-disable-next-line no-var
  var __careerOpsJobStore: JobStore | undefined;
}

class JobStore extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private persistTimer: NodeJS.Timeout | null = null;
  private booted = false;

  async ensureBooted(): Promise<void> {
    if (this.booted) return;
    this.booted = true;
    try {
      const text = await fs.readFile(STORE_FILE, "utf8");
      const arr: Job[] = JSON.parse(text);
      for (const j of arr) {
        // Any job that was 'running' when the server died is orphaned.
        if (j.status === "running" || j.status === "queued") {
          j.status = "interrupted";
          j.endedAt = j.endedAt ?? Date.now();
        }
        this.jobs.set(j.id, j);
      }
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("[jobstore] failed to load:", e);
      }
    }
  }

  list(): Job[] {
    return [...this.jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  upsert(job: Job): void {
    this.jobs.set(job.id, job);
    this.emit(`job:${job.id}`, { type: "status", job });
    this.emit("any", job);
    this.schedulePersist();
  }

  appendLog(id: string, line: JobLogLine): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.log.push(line);
    if (job.log.length > MAX_LOG_LINES) {
      job.log.splice(0, job.log.length - MAX_LOG_LINES);
    }
    this.emit(`job:${id}`, { type: "log", line });
    this.schedulePersist();
  }

  /**
   * SSE clients call this and get an unsubscribe.
   */
  subscribe(
    id: string,
    handler: (event: { type: "log"; line: JobLogLine } | { type: "status"; job: Job }) => void,
  ): () => void {
    const channel = `job:${id}`;
    this.on(channel, handler);
    return () => this.off(channel, handler);
  }

  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => void this.persist(), PERSIST_DEBOUNCE_MS);
  }

  private async persist(): Promise<void> {
    try {
      const dir = path.dirname(STORE_FILE);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const tmp = `${STORE_FILE}.tmp`;
      await fs.writeFile(tmp, JSON.stringify([...this.jobs.values()]), "utf8");
      await fs.rename(tmp, STORE_FILE);
    } catch (e) {
      console.error("[jobstore] persist failed:", e);
    }
  }
}

export function getJobStore(): JobStore {
  if (!globalThis.__careerOpsJobStore) {
    globalThis.__careerOpsJobStore = new JobStore();
  }
  return globalThis.__careerOpsJobStore;
}
