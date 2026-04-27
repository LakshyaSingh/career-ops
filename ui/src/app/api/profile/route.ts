import { NextResponse } from "next/server";
import {
  readProfile,
  writeProfileBasics,
  type ProfileBasics,
} from "@/lib/career-ops/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readProfile();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { basics?: ProfileBasics };
  if (!body.basics || typeof body.basics !== "object") {
    return NextResponse.json(
      { error: "basics (object) required" },
      { status: 400 },
    );
  }
  await writeProfileBasics(body.basics);
  return NextResponse.json({ ok: true });
}
