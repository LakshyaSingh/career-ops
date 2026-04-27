import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "@/lib/career-ops/paths";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".html": "text/html; charset=utf-8",
  ".tex": "text/x-tex; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Serves files from the career-ops `output/` directory. Catch-all segments
 * are joined relative to that root and verified to stay inside it — anything
 * with `..` or absolute paths returns 404.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await ctx.params;
  if (!segments?.length) return new Response("not found", { status: 404 });

  const outputRoot = path.resolve(paths.outputDir());
  const requested = path.resolve(outputRoot, ...segments);
  if (!requested.startsWith(outputRoot + path.sep)) {
    return new Response("not found", { status: 404 });
  }

  let stat;
  try {
    stat = await fs.stat(requested);
  } catch {
    return new Response("not found", { status: 404 });
  }
  if (!stat.isFile()) return new Response("not found", { status: 404 });

  const data = await fs.readFile(requested);
  const ext = path.extname(requested).toLowerCase();
  const mime = MIME[ext] ?? "application/octet-stream";
  const url = new URL(request.url);
  const disposition = url.searchParams.get("download") === "1"
    ? "attachment"
    : "inline";

  // Bytes-as-Uint8Array — strict ArrayBuffer in TS lib targets, so use the underlying buffer.
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stat.size),
      "Content-Disposition": `${disposition}; filename="${path.basename(requested)}"`,
      "Cache-Control": "no-store",
    },
  });
}
