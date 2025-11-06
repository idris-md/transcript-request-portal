// app/api/register/lookup/route.ts
import { NextResponse } from "next/server";
import { findStudentByMatric } from "@/lib/eportal";

export async function POST(req: Request) {
  const { matric } = await req.json();
  const s = await findStudentByMatric(matric.trim());
  if (!s) return NextResponse.json({ found: false }, { status: 404 });
  return NextResponse.json({ found: true, data: s });
}
