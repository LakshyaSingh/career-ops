import { NextResponse } from "next/server";
import { getJobStore } from "@/lib/jobs/store";
import { startEvaluateJob, startPdfJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getJobStore();
  await store.ensureBooted();
  const jobs = store.list().map((j) => ({ ...j, log: [] }));
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { kind?: string; url?: string };
  if (typeof body.url !== "string" || !body.url.trim()) {
    return NextResponse.json({ error: "url (string) required" }, { status: 400 });
  }
  try {
    new URL(body.url);
  } catch {
    return NextResponse.json({ error: "url is not valid" }, { status: 400 });
  }

  const url = body.url.trim();
  switch (body.kind) {
    case undefined:
    case "evaluate": {
      const job = await startEvaluateJob({ url });
      return NextResponse.json({ job: { ...job, log: [] } });
    }
    case "pdf": {
      const job = await startPdfJob({ url });
      return NextResponse.json({ job: { ...job, log: [] } });
    }
    default:
      return NextResponse.json(
        { error: `Unknown kind: ${body.kind}` },
        { status: 400 },
      );
  }
}
