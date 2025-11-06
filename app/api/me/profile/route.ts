// app/api/me/profile/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import { auth } from "../../auth/[...nextauth]/route";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matric = (session as any).matric;

  const [rows] = await transcriptPool.query(
    `SELECT
        full_name,
        matric_no,
        department,
        school,
        level,
        entry_session
     FROM students
     WHERE matric_no = ?
     LIMIT 1`,
    [matric]
  );

  const row = (rows as any[])[0];
  if (!row) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(row);
}
