import { promises as fs } from "node:fs";
import { paths } from "./paths";

/**
 * Canonical statuses from career-ops's `templates/states.yml`.
 * Reproduced here so the UI can validate without reading the YAML.
 */
export const CANONICAL_STATUSES = [
  "Evaluated",
  "Applied",
  "Responded",
  "Interview",
  "Offer",
  "Rejected",
  "Discarded",
  "SKIP",
] as const;

export type Status = (typeof CANONICAL_STATUSES)[number] | string;

export interface TrackerEntry {
  num: string;
  date: string;
  company: string;
  role: string;
  score: string;       // e.g. "4.2/5"
  scoreNumeric: number | null;
  status: Status;
  pdf: boolean;
  reportPath: string | null;  // relative path inside repo
  notes: string;
}

/**
 * Parses career-ops's `data/applications.md` markdown table.
 *
 * Format (from CLAUDE.md): `# | Date | Company | Role | Score | Status | PDF | Report | Notes`
 * Note: in applications.md, Score comes BEFORE Status (the TSV format used by
 * tracker-additions has them swapped — merge-tracker.mjs handles the swap).
 */
export async function readTracker(): Promise<TrackerEntry[]> {
  let raw: string;
  try {
    raw = await fs.readFile(paths.applications(), "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }

  const lines = raw.split("\n");
  const entries: TrackerEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    // Skip header and separator rows
    if (trimmed.includes("---")) continue;
    if (/\|\s*#\s*\|/i.test(trimmed)) continue;

    // Split on `|` and trim each cell. The leading and trailing pipes give us
    // empty strings on either end, which we drop.
    const cells = trimmed.split("|").map((c) => c.trim());
    if (cells.length < 10) continue; // need at least 9 columns + 2 edge empties
    const [, num, date, company, role, score, status, pdf, report, ...notesParts] = cells;
    if (!num || !date) continue;
    if (!/^\d+$/.test(num)) continue;

    const scoreMatch = score.match(/^([\d.]+)\s*\/\s*5$/);
    const reportMatch = report.match(/\(([^)]+)\)/);

    entries.push({
      num,
      date,
      company,
      role,
      score,
      scoreNumeric: scoreMatch ? parseFloat(scoreMatch[1]) : null,
      status: status.replace(/\*\*/g, "").trim(),
      pdf: pdf.includes("✅"),
      reportPath: reportMatch ? reportMatch[1] : null,
      // notesParts has a trailing empty element from the closing `|`
      notes: notesParts.filter(Boolean).join("|").trim(),
    });
  }

  return entries;
}
