import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "./paths";

export interface OutputFile {
  name: string;
  ext: string;            // ".pdf", ".html", etc.
  size: number;           // bytes
  mtime: number;          // ms since epoch
  /** Best-effort guess from career-ops's PDF naming convention. */
  parsed: {
    candidate: string | null;
    company: string | null;
    date: string | null;
  };
}

/**
 * Lists all files in `output/`, sorted newest first by mtime.
 *
 * career-ops names tailored CVs as:
 *   cv-{candidate-slug}-{company-slug}-{YYYY-MM-DD}.pdf
 * We do a best-effort parse so the listing UI can show clean labels;
 * the raw filename is always preserved as a fallback.
 */
export async function listOutput(): Promise<OutputFile[]> {
  const dir = paths.outputDir();
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }

  const files: OutputFile[] = [];
  for (const name of entries) {
    if (name.startsWith(".")) continue; // .gitkeep
    const full = path.join(dir, name);
    let stat;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;

    files.push({
      name,
      ext: path.extname(name).toLowerCase(),
      size: stat.size,
      mtime: stat.mtimeMs,
      parsed: parseCVName(name),
    });
  }

  files.sort((a, b) => b.mtime - a.mtime);
  return files;
}

function parseCVName(name: string): OutputFile["parsed"] {
  const m = name.match(/^cv-(.+?)-(.+?)-(\d{4}-\d{2}-\d{2})\.pdf$/i);
  if (!m) return { candidate: null, company: null, date: null };
  return { candidate: m[1], company: m[2], date: m[3] };
}
