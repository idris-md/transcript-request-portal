// app/api/requests/[id]/destination/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { transcriptPool } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: return current destination for a request (only if it belongs to logged-in student)
export async function GET(req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matric = (session as any).matric;
  const id = Number(params?.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Confirm the request belongs to this student
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

  // Get the most recent destination
  const [destRows] = await transcriptPool.query(
    `SELECT
        id,
        institution_name,
        country,
        address_line1,
        address_line2,
        city,
        state_region,
        postal_code,
        email_recipient,
        created_at
     FROM destinations
     WHERE request_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [id]
  );

  const dest = (destRows as any[])[0] ?? null;
  return NextResponse.json(dest);
}

// POST: create destination for this request (student-provided)
export async function POST(req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matric = (session as any).matric;
  const requestId = Number(params?.id);

  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json();
  const {
    institution_name,
    country,
    address_line1,
    address_line2,
    city,
    state_region,
    postal_code,
    email_recipient,
  } = body;

  // Confirm the request belongs to this student and fetch scope/status
  const [rows] = await transcriptPool.query(
    `SELECT r.scope, r.status
       FROM transcript_requests r
       JOIN students s ON s.id = r.student_id
      WHERE r.id = ?
        AND s.matric_no = ?
      LIMIT 1`,
    [requestId, matric]
  );

  const reqRow = (rows as any[])[0];
  if (!reqRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reqRow.status !== "PAID" && reqRow.status !== "SUBMITTED") {
    return NextResponse.json(
      { error: "Request must be paid before setting destination" },
      { status: 400 }
    );
  }

  // Enforce Nigeria-only for WITHIN_NG
  if (reqRow.scope === "WITHIN_NG" && country !== "Nigeria") {
    return NextResponse.json(
      { error: "Country must be Nigeria for requests within Nigeria" },
      { status: 400 }
    );
  }

  // Insert destination
  await transcriptPool.query(
    `INSERT INTO destinations
       (request_id, institution_name, country, address_line1, address_line2, city, state_region, postal_code, email_recipient)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      requestId,
      institution_name,
      country,
      address_line1,
      address_line2 ?? null,
      city ?? null,
      state_region ?? null,
      postal_code ?? null,
      email_recipient ?? null,
    ]
  );

  // If just paid and no destination before, mark as SUBMITTED
  if (reqRow.status === "PAID") {
    await transcriptPool.query(
      "UPDATE transcript_requests SET status='SUBMITTED' WHERE id=?",
      [requestId]
    );
    await transcriptPool.query(
      "INSERT INTO status_events (request_id, status, note) VALUES (?,?,?)",
      [requestId, "SUBMITTED", "Destination provided by student"]
    );
  }

  return NextResponse.json({ ok: true });
}
