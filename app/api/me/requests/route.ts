// app/api/me/requests/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import { auth } from "../../auth/[...nextauth]/route";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const [rows] = await transcriptPool.query(
    `SELECT r.id, r.scope, r.status, r.created_at
     FROM transcript_requests r
     JOIN students s ON s.id = r.student_id
     WHERE s.matric_no = ?
     ORDER BY r.created_at DESC`,
    [(session as any).matric]
  );
  return NextResponse.json(rows);
}
