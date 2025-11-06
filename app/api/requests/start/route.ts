// app/api/requests/start/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import { auth } from "@/lib/auth";
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { scope, requestEmail } = await req.json(); // scope: WITHIN_NG|OUTSIDE_NG
  const [stuRows] = await transcriptPool.query(
    "SELECT id FROM students WHERE matric_no=? LIMIT 1",
    [(session as any).matric]
  );
  const student = (stuRows as any[])[0];

  const [setRows] = await transcriptPool.query(
    "SELECT value_json FROM settings WHERE key_name='TRANSCRIPT_PRICING' LIMIT 1"
  );
  const pricing = JSON.parse((setRows as any[])[0].value_json);
  const amountNGN = scope === 'WITHIN_NG' ? pricing.WITHIN_NG.amountNGN : pricing.OUTSIDE_NG.amountNGN;

  // create request as DRAFT + PAYMENT_PENDING
  const [res] = await transcriptPool.query(
    "INSERT INTO transcript_requests (student_id, scope, request_email, status) VALUES (?,?,?, 'PAYMENT_PENDING')",
    [student.id, scope, requestEmail]
  );

  return NextResponse.json({
    requestId: (res as any).insertId,
    amountNGN
  });
}
