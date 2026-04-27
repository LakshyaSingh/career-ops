import { NextResponse } from "next/server";
import { getJobStore } from "@/lib/jobs/store";
import { startEvaluateJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getJobStore();
  await store.ensureBooted();
  // Strip log lines from the listing — the per-job stream endpoint serves them.
  const jobs = store.list().map((j) => ({ ...j, log: [] }));
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { kind?: string; url?: string };
  if (body.kind && body.kind !== "evaluate") {
    return NextResponse.json(
      { error: `Unknown kind: ${body.kind}` },
      { status: 400 },
    );
  }
  if (typeof body.url !== "string" || !body.url.trim()) {
    return NextResponse.json(
      { error: "url (string) required" },
      { status: 400 },
    );
  }
  // Quick URL sanity check.
  try {
    new URL(body.url);
  } catch {
    return NextResponse.json({ error: "url is not valid" }, { status: 400 });
  }

  const job = await startEvaluateJob({ url: body.url.trim() });
  return NextResponse.json({ job: { ...job, log: [] } });
}
