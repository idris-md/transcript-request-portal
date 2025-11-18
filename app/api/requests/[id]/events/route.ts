// app/api/requests/[id]/events/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: any
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matric = (session as any).matric;
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // First confirm this request belongs to the current student
  const [reqRows] = await transcriptPool.query(
    `SELECT r.id
       FROM transcript_requests r
       JOIN students s ON s.id = r.student_id
      WHERE r.id = ?
        AND s.matric_no = ?
      LIMIT 1`,
    [id, matric]
  );

  const reqRow = (reqRows as any[])[0];
  if (!reqRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Then get events
  const [events] = await transcriptPool.query(
    `SELECT status, note, created_at
       FROM status_events
      WHERE request_id = ?
      ORDER BY created_at ASC`,
    [id]
  );

  return NextResponse.json(events);
}
