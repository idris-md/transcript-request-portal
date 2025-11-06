import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth(); // if you used getServerSession, change accordingly
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matric = (session as any).matric;
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [rows] = await transcriptPool.query(
    `SELECT r.id,
            r.scope,
            r.status,
            r.request_email,
            r.created_at
       FROM transcript_requests r
       JOIN students s ON s.id = r.student_id
      WHERE r.id = ?
        AND s.matric_no = ?
      LIMIT 1`,
    [id, matric]
  );

  const row = (rows as any[])[0];
  if (!row) {
    // route exists, but this request either doesn't exist or doesn't belong to this student
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}
