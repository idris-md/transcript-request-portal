// app/api/requests/:id/destination/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const requestId = Number(params.id);
  const body = await _.json();
  const { institution_name, country, address_line1, address_line2, city, state_region, postal_code, email_recipient } = body;

  // fetch scope to enforce default country for WITHIN_NG
  const [rows] = await transcriptPool.query(
    "SELECT scope, status FROM transcript_requests WHERE id=? LIMIT 1", [requestId]
  );
  const reqRow = (rows as any[])[0];
  if (!reqRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reqRow.status !== 'PAID' && reqRow.status !== 'SUBMITTED')
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });

  if (reqRow.scope === 'WITHIN_NG' && country !== 'Nigeria') {
    return NextResponse.json({ error: "Country must be Nigeria for WITHIN_NG" }, { status: 400 });
  }

  await transcriptPool.query(
    `INSERT INTO destinations (request_id, institution_name, country, address_line1, address_line2, city, state_region, postal_code, email_recipient)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [requestId, institution_name, country, address_line1, address_line2 ?? null, city ?? null, state_region ?? null, postal_code ?? null, email_recipient ?? null]
  );

  // mark SUBMITTED if not already
  if (reqRow.status === 'PAID') {
    await transcriptPool.query("UPDATE transcript_requests SET status='SUBMITTED' WHERE id=?", [requestId]);
    await transcriptPool.query("INSERT INTO status_events (request_id, status, note) VALUES (?,?,?)",
      [requestId, 'SUBMITTED', 'Destination provided by student']);
  }
  return NextResponse.json({ ok: true });
}

// // app/api/requests/[id]/destination/route.ts
// import { NextResponse } from "next/server";
// import { transcriptPool } from "@/lib/db";
// import { auth } from "@/auth"; // or getServerSession if that's your setup

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth(); // if you use getServerSession, swap accordingly
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matric = (session as any).matric;
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Check that the request belongs to this student
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

  // Get the most recent destination for this request (if you ever support multiple)
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
  if (!dest) {
    return NextResponse.json(null);
  }

  return NextResponse.json(dest);
}



// app/api/requests/[id]/route.ts
