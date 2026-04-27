import { NextResponse } from "next/server";
import { readCV, writeCV } from "@/lib/career-ops/cv";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readCV();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const { content } = (await request.json()) as { content?: string };
  if (typeof content !== "string") {
    return NextResponse.json({ error: "content (string) required" }, { status: 400 });
  }
  await writeCV(content);
  return NextResponse.json({ ok: true });
}
