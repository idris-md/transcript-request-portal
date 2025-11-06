// app/api/payments/verify/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";

async function linkPaymentToRequest(conn: any, paymentRow: any) {
  // Try to find the most recent request for this student that is still pending/paid
  const [reqRows] = await conn.query(
    `SELECT id, status
     FROM transcript_requests
     WHERE student_id = ?
       AND status IN ('PAYMENT_PENDING', 'PAID')
     ORDER BY created_at DESC
     LIMIT 1`,
    [paymentRow.student_id]
  );

  const request = (reqRows as any[])[0];
  if (!request) return null;

  // If not already linked, link payment + mark as PAID
  await conn.query(
    "UPDATE transcript_requests SET payment_id = ?, status = 'PAID' WHERE id = ?",
    [paymentRow.id, request.id]
  );

  await conn.query(
    "INSERT INTO status_events (request_id, status, note) VALUES (?,?,?)",
    [request.id, "PAID", "Payment verified via requery"]
  );

  return request.id as number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("ref");

  if (!reference) {
    return NextResponse.json(
      { ok: false, success: false, error: "Missing reference" },
      { status: 400 }
    );
  }

  // 1) Find payment record in DB
  const [payRows] = await transcriptPool.query(
    "SELECT * FROM payments WHERE reference = ? LIMIT 1",
    [reference]
  );
  const payment = (payRows as any[])[0];

  if (!payment) {
    // Optional: you could still hit Paystack here and create a record,
    // but for now we assume all payments come from /payments/init which inserted a row.
    return NextResponse.json(
      { ok: false, success: false, error: "Payment not found" },
      { status: 404 }
    );
  }

  // If already marked SUCCESS, no need to hit Paystack again
  if (payment.status === "SUCCESS") {
    // Try to ensure request is linked
    const [rRows] = await transcriptPool.query(
      "SELECT id FROM transcript_requests WHERE payment_id = ? LIMIT 1",
      [payment.id]
    );

    let requestId: number | null = (rRows as any[])[0]?.id ?? null;

    if (!requestId) {
      // Try to link it now (just in case earlier logic failed)
      const conn = await transcriptPool.getConnection();
      try {
        await conn.beginTransaction();
        requestId = await linkPaymentToRequest(conn, payment);
        await conn.commit();
      } catch (e) {
        await conn.rollback();
      } finally {
        conn.release();
      }
    }

    return NextResponse.json({
      ok: true,
      success: true,
      requestId: requestId ?? undefined,
    });
  }

  // 2) Payment not yet SUCCESS in DB ⇒ requery Paystack

  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      reference
    )}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );
  const verifyJson = await paystackRes.json();

  const data = verifyJson?.data;
  const paystackSuccess = data?.status === "success";

  const conn = await transcriptPool.getConnection();

  try {
    await conn.beginTransaction();

    // Update payment row with fresh status + payload
    await conn.query(
      `UPDATE payments
       SET status = ?,
           paid_at = IF(?, NOW(), paid_at),
           raw_verify_json = ?
       WHERE reference = ?`,
      [
        paystackSuccess ? "SUCCESS" : "FAILED",
        paystackSuccess ? 1 : 0,
        JSON.stringify(verifyJson),
        reference,
      ]
    );

    let requestId: number | null = null;

    if (paystackSuccess) {
      // Re-read payment row with updated status
      const [pRows2] = await conn.query(
        "SELECT * FROM payments WHERE reference = ? LIMIT 1",
        [reference]
      );
      const payment2 = (pRows2 as any[])[0];

      // Link to most recent request for that student
      requestId = await linkPaymentToRequest(conn, payment2);
    }

    await conn.commit();

    return NextResponse.json({
      ok: true,
      success: paystackSuccess,
      requestId: requestId ?? undefined,
    });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json(
      { ok: false, success: false, error: "Error while verifying payment" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
