// app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { transcriptPool } from "@/lib/db";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const raw = await req.text();
  const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  const signature = (req.headers.get("x-paystack-signature") || "").toLowerCase();
  if (hash !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(raw);
  if (event.event === "charge.success") {
    const reference = event.data.reference;
    const conn = await transcriptPool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE payments SET status='SUCCESS', paid_at=NOW(), raw_verify_json=? WHERE reference=?",
        [JSON.stringify(event), reference]);

      const [pRows] = await conn.query("SELECT id, student_id FROM payments WHERE reference=?", [reference]);
      const payment = (pRows as any[])[0];
      const [rRows] = await conn.query(
        "SELECT id FROM transcript_requests WHERE student_id=? AND status='PAYMENT_PENDING' ORDER BY created_at DESC LIMIT 1",
        [payment.student_id]
      );
      const request = (rRows as any[])[0];
      if (request) {
        await conn.query("UPDATE transcript_requests SET payment_id=?, status='PAID' WHERE id=?",
          [payment.id, request.id]);
        await conn.query("INSERT INTO status_events (request_id, status, note) VALUES (?,?,?)",
          [request.id, 'PAID', 'Payment verified via webhook']);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
    } finally {
      conn.release();
    }
  }

  return NextResponse.json({ received: true });
}
