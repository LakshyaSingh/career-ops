import { NextResponse } from "next/server";
import { getJobStore } from "@/lib/jobs/store";
import { cancelJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const store = getJobStore();
  await store.ensureBooted();
  const job = store.get(id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const ok = cancelJob(id);
  if (!ok) {
    return NextResponse.json(
      { error: "job not running" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
