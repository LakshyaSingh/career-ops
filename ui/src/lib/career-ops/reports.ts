import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "./paths";

export interface Report {
  filename: string;        // e.g. "001-acme-2025-01-15.md"
  num: string | null;      // "001"
  slug: string | null;     // "acme"
  date: string | null;     // "2025-01-15"
  content: string;         // raw markdown
}

/**
 * Reads a single report safely. The `segments` come from a Next.js catch-all
 * route — they may be malicious (e.g. ["..", "..", "etc", "passwd"]). We
 * resolve relative to the reports/ directory and verify the resolved path
 * stays inside that directory.
 *
 * Throws "not-found" if the file doesn't exist or is outside reports/.
 */
export async function readReport(segments: string[]): Promise<Report> {
  const reportsRoot = path.resolve(paths.reportsDir());
  const requested = path.resolve(reportsRoot, ...segments);
  if (
    requested !== reportsRoot &&
    !requested.startsWith(reportsRoot + path.sep)
  ) {
    throw new Error("not-found"); // path traversal attempt
  }
  let content: string;
  try {
    content = await fs.readFile(requested, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("not-found");
    }
    throw e;
  }

  const filename = path.basename(requested);
  const m = filename.match(/^(\d{3})-(.+?)-(\d{4}-\d{2}-\d{2})\.md$/);
  return {
    filename,
    num:   m ? m[1] : null,
    slug:  m ? m[2] : null,
    date:  m ? m[3] : null,
    content,
  };
}
