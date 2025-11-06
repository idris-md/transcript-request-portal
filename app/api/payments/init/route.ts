// app/api/payments/init/route.ts
import { NextResponse } from "next/server";
import { transcriptPool } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const { requestId, amountNGN, email } = await req.json();
  const reference = `TRX_${nanoid(18)}`;

  const amountKobo = amountNGN * 100;
  // create payment record INITIATED
  const [reqRow] = await transcriptPool.query("SELECT student_id FROM transcript_requests WHERE id=?", [requestId]);
  const studentId = (reqRow as any[])[0]?.student_id;

  await transcriptPool.query(
    "INSERT INTO payments (student_id, gateway, reference, amount_kobo, currency, status) VALUES (?,?,?,?, 'NGN', 'INITIATED')",
    [studentId, 'PAYSTACK', reference, amountKobo]
  );

  // call Paystack initialize
  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: `${process.env.APP_URL}/payments/callback?ref=${reference}`
    })
  });
  const initJson = await initRes.json();

  // store init payload
  await transcriptPool.query(
    "UPDATE payments SET raw_init_json=? WHERE reference=?",
    [JSON.stringify(initJson), reference]
  );

  return NextResponse.json({ reference, authUrl: initJson.data.authorization_url });
}
