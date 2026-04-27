export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "interrupted"; // process was lost when the dev server restarted

export type JobKind = "evaluate" | "pdf"; // future: "scan"

export interface JobLogLine {
  t: number;            // ms since epoch
  stream: "out" | "err" | "system";
  text: string;
}

export interface Job {
  id: string;
  kind: JobKind;
  target: string;       // e.g. the URL being evaluated
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  exitCode?: number | null;
  command: string;      // human-readable command we ran
  log: JobLogLine[];
}

/**
 * Persisted shape — everything except the live process handle.
 */
export type StoredJob = Omit<Job, never>;
