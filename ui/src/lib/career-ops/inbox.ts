import { promises as fs } from "node:fs";
import { paths } from "./paths";

export interface InboxEntry {
  url: string;
  company: string;
  title: string;
  done: boolean;     // markdown checkbox state
  raw: string;       // original line (for fallback display)
  firstSeen?: string; // YYYY-MM-DD from data/scan-history.tsv when available
}

/**
 * Parses the `## Pendientes` (and `## Procesadas`) sections of
 * `data/pipeline.md`. Format written by `scan.mjs`:
 *
 *   - [ ] {url} | {company} | {title}
 *   - [x] {url} | {company} | {title}
 *
 * Returns only the pending items by default; pass `{ done: true }` to
 * retrieve completed ones too.
 */
export interface InboxResult {
  pending: InboxEntry[];
  processed: InboxEntry[];
}

export async function readInbox(): Promise<InboxResult> {
  let raw: string;
  try {
    raw = await fs.readFile(paths.pipeline(), "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { pending: [], processed: [] };
    }
    throw e;
  }

  const scanDates = await readScanDatesByUrl();
  const lines = raw.split("\n");
  const pending: InboxEntry[] = [];
  const processed: InboxEntry[] = [];
  let bucket: "pending" | "processed" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+Pendientes\b/i.test(trimmed)) { bucket = "pending"; continue; }
    if (/^##\s+Procesadas\b/i.test(trimmed)) { bucket = "processed"; continue; }
    if (/^##\s+/.test(trimmed)) { bucket = null; continue; }
    if (!bucket) continue;

    const m = trimmed.match(/^-\s*\[([ xX])\]\s+(\S+)\s*\|\s*([^|]+?)\s*\|\s*(.+)$/);
    if (!m) continue;

    const entry: InboxEntry = {
      done: m[1].toLowerCase() === "x",
      url: m[2].trim(),
      company: m[3].trim(),
      title: m[4].trim(),
      raw: line,
    };
    entry.firstSeen = scanDates.get(entry.url);
    (bucket === "pending" ? pending : processed).push(entry);
  }

  return { pending, processed };
}

async function readScanDatesByUrl(): Promise<Map<string, string>> {
  let raw: string;
  try {
    raw = await fs.readFile(paths.scanHistory(), "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return new Map();
    throw e;
  }

  const dates = new Map<string, string>();
  for (const line of raw.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const [url, firstSeen] = line.split("\t");
    if (!url || !firstSeen) continue;
    const normalizedDate = firstSeen.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      dates.set(url.trim(), normalizedDate);
    }
  }
  return dates;
}
