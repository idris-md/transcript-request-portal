// app/api/me/payments/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import { auth } from "../../auth/[...nextauth]/route";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const [rows] = await transcriptPool.query(
    `SELECT p.reference, p.amount_kobo, p.status, p.paid_at
     FROM payments p
     JOIN students s ON s.id = p.student_id
     WHERE s.matric_no = ?
     ORDER BY p.created_at DESC`,
    [(session as any).matric]
  );
  return NextResponse.json(rows);
}
